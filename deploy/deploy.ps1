# Деплой сайта на сервер одной командой (из корня портфолио):
#   powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1                 # showmyworks.ru
#   powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1 -Site money     # money (папка ..\money)
#
# Что делает: собирает Docker-образ(ы) здесь, на Windows (на сервере 1 ГБ памяти – next build там не влезет),
# пушит их в реестр сервера через ssh-туннель – уходят только изменённые слои, – и перезапускает сайт
# (/opt/proxy/site-up.sh). Нужны запущенный Docker Desktop и ssh-ключ без пароля (~\.ssh\id_ed25519).
# Серверная часть ставится один раз: deploy\setup-server.ps1.
param(
    [ValidateSet('portfolio', 'money')][string]$Site = 'portfolio',
    [string]$Server = 'root@2.31.105.139',
    [string]$Key = "$HOME\.ssh\id_ed25519",
    # Только для первого деплоя money: основной домен без www
    [string]$Domain,
    # Деплоить, даже если в git есть незакоммиченные правки (они попадут в образ)
    [switch]$Force
)
$ErrorActionPreference = 'Continue'
$TunnelPort = 5055            # порт реестра внутри Docker Desktop (127.0.0.1:5055 → сервер 127.0.0.1:5000)
$Registry = "127.0.0.1:$TunnelPort"   # 127.0.0.1 Docker пускает без HTTPS
$Tunnel = 'deploy-tunnel'

function Say($text) { Write-Host "==> $text" -ForegroundColor Green }
function Fail($text) { Write-Host "[x] $text" -ForegroundColor Red; exit 1 }
function Run {
    # Нативная команда; ненулевой код – стоп
    $exe, $rest = $args
    & $exe @rest
    if ($LASTEXITCODE -ne 0) { Fail "Команда не удалась: $($args -join ' ')" }
}
function New-Secret {
    $bytes = New-Object byte[] 30
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes) -replace '[/+=]', ''
}

$portfolioRoot = Resolve-Path "$PSScriptRoot\.."
$sites = @{
    portfolio = @{
        Repo   = "$portfolioRoot"
        Images = @(@{ Name = 'portfolio'; Context = '.' })
    }
    money     = @{
        Repo   = (Join-Path (Split-Path $portfolioRoot) 'money')
        Images = @(
            @{ Name = 'money-strapi'; Context = 'strapi' },
            @{ Name = 'money-next'; Context = 'next' }
        )
    }
}
$cfg = $sites[$Site]
if (-not (Test-Path $cfg.Repo)) { Fail "Нет папки проекта $($cfg.Repo)" }
if (-not (Test-Path $Key)) { Fail "Нет ssh-ключа $Key" }

docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) { Fail 'Docker Desktop не запущен' }
ssh -o BatchMode=yes -o ConnectTimeout=10 $Server 'test -f /opt/proxy/site-up.sh'
if ($LASTEXITCODE -ne 0) { Fail "Сервер $Server недоступен или не настроен – сначала deploy\setup-server.ps1" }

# --- git: что именно уезжает ---------------------------------------------------
Push-Location $cfg.Repo
try {
    $commit = (git rev-parse --short HEAD).Trim()
    $dirty = git status --porcelain --untracked-files=no
    if ($dirty -and -not $Force) {
        Write-Host ($dirty -join "`n")
        Fail 'Есть незакоммиченные правки – закоммитьте их или запустите с -Force (тогда они попадут на сервер)'
    }
    Say "$Site @ $commit$(if ($dirty) { ' + незакоммиченные правки' })"

    # --- money: .env на сервере при первом деплое и адрес Strapi для сборки Next ---
    $buildArgs = @{}
    if ($Site -eq 'money') {
        $serverDomain = (ssh -o BatchMode=yes $Server "grep -s '^DOMAIN=' /opt/sites/money/.env | cut -d= -f2-")
        $serverDomain = "$serverDomain".Trim()
        if (-not $serverDomain) {
            if (-not $Domain) { Fail 'Первый деплой money: укажите домен, например -Domain example.ru' }
            Say "Создаю /opt/sites/money/.env для $Domain со случайными секретами"
            $local = @{}
            if (Test-Path .env) {
                Get-Content .env -Encoding UTF8 | Where-Object { $_ -match '^(AWS_[A-Z_]+|SMTP_[A-Z_]+|DEFAULT_[A-Z_]+|MODERATION_EMAILS)=(.+)$' } |
                    ForEach-Object { $local[$Matches[1]] = $Matches[2] }
            }
            $lines = Get-Content "$PSScriptRoot\server\sites\money\env.example" -Encoding UTF8 | ForEach-Object {
                if ($_ -match '^DOMAIN=') { "DOMAIN=$Domain" }
                elseif ($_ -match '^APP_KEYS=') { 'APP_KEYS=' + ((1..4 | ForEach-Object { New-Secret }) -join ',') }
                elseif ($_ -match '^([A-Z_]+)=change_me$') { "$($Matches[1])=$(New-Secret)" }
                elseif ($_ -match '^([A-Z_]+)=' -and $local.ContainsKey($Matches[1])) { "$($Matches[1])=$($local[$Matches[1]])" }
                else { $_ }
            }
            $tmp = Join-Path $env:TEMP 'money.env'
            [IO.File]::WriteAllText($tmp, (($lines -join "`n") + "`n"), (New-Object Text.UTF8Encoding $false))
            Run scp -q $tmp "${Server}:/opt/sites/money/.env"
            Remove-Item $tmp
            ssh $Server 'chmod 600 /opt/sites/money/.env'
            $serverDomain = $Domain
        }
        elseif ($Domain -and $Domain -ne $serverDomain) {
            Fail "На сервере DOMAIN=$serverDomain – меняйте его в /opt/sites/money/.env, а не флагом"
        }
        $buildArgs['NEXT_PUBLIC_STRAPI_URL'] = "https://cms.$serverDomain"
    }

    # --- сборка ----------------------------------------------------------------
    foreach ($img in $cfg.Images) {
        Say "Собираю образ $($img.Name)"
        $argList = @('build', '-t', "$Registry/$($img.Name):latest", '--label', "commit=$commit")
        foreach ($k in $buildArgs.Keys) { $argList += @('--build-arg', "$k=$($buildArgs[$k])") }
        $argList += $img.Context
        Run docker @argList
    }
}
finally { Pop-Location }

# --- ssh-туннель к реестру из Docker Desktop -------------------------------------
# Демон Docker Desktop не видит localhost Windows, поэтому туннель живёт в контейнере с сетью host:
# его localhost:5055 – это localhost демона
docker image inspect deploy-ssh:1 *> $null
if ($LASTEXITCODE -ne 0) {
    Say 'Готовлю образ туннеля (один раз)'
    $dir = Join-Path $env:TEMP 'deploy-ssh'
    New-Item -ItemType Directory -Force $dir | Out-Null
    [IO.File]::WriteAllText("$dir\Dockerfile", "FROM alpine:3.22`nRUN apk add --no-cache openssh-client`n")
    docker build -q -t deploy-ssh:1 $dir | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail 'Не собрался образ туннеля' }
}
$hostPart = ($Server -split '@')[-1]
docker rm -f $Tunnel *> $null
Say "Открываю туннель к реестру $hostPart"
Run docker run -d --rm --name $Tunnel --network host `
    -v "${Key}:/run/key:ro" -v "$HOME\.ssh\known_hosts:/run/known_hosts:ro" deploy-ssh:1 `
    sh -c "cp /run/key /tmp/key && chmod 600 /tmp/key && exec ssh -i /tmp/key -o UserKnownHostsFile=/run/known_hosts -o StrictHostKeyChecking=yes -o ExitOnForwardFailure=yes -o ServerAliveInterval=20 -N -L 127.0.0.1:${TunnelPort}:127.0.0.1:5000 $Server" | Out-Null

try {
    $ready = $false
    foreach ($i in 1..20) {
        docker run --rm --network host deploy-ssh:1 wget -q -O /dev/null "http://127.0.0.1:$TunnelPort/v2/" *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Milliseconds 700
    }
    if (-not $ready) { docker logs $Tunnel; Fail 'Туннель не поднялся' }

    foreach ($img in $cfg.Images) {
        Say "Отправляю $($img.Name) (только изменённые слои)"
        Run docker push "$Registry/$($img.Name):latest"
    }
}
finally { docker rm -f $Tunnel *> $null }

# --- перезапуск на сервере -------------------------------------------------------
Say 'Перезапускаю сайт на сервере'
ssh $Server "sh /opt/proxy/site-up.sh $Site"
if ($LASTEXITCODE -ne 0) { Fail 'Сайт не поднялся – вывод выше' }
docker image prune -f *> $null
Say "Готово: $Site @ $commit"
