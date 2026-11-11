# Серверная часть (один раз и после правок в deploy\server):
#   powershell -ExecutionPolicy Bypass -File deploy\setup-server.ps1
# Заливает deploy\server\proxy → /opt/proxy и deploy\server\sites\*\compose.yml → /opt/sites/*,
# создаёт сеть web и поднимает nginx + certbot + реестр. .env сайтов и сертификаты не трогает.
#
#   -PortfolioEnv .env.local   – первый раз: залить этот файл как /opt/sites/portfolio/.env
#   -Cert showmyworks.ru       – выпустить сертификат (когда домен уже смотрит на сервер)
# Docker и swap на сервере уже стоят; на чистом сервере скрипт поставит Docker сам.
param(
    [string]$Server = 'root@2.31.105.139',
    [string]$PortfolioEnv,
    [string]$Cert
)
$ErrorActionPreference = 'Continue'
function Say($text) { Write-Host "==> $text" -ForegroundColor Green }
function Fail($text) { Write-Host "[x] $text" -ForegroundColor Red; exit 1 }

$root = Join-Path $PSScriptRoot 'server'

ssh -o BatchMode=yes -o ConnectTimeout=10 $Server 'command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh >/dev/null; mkdir -p /opt/proxy /opt/sites'
if ($LASTEXITCODE -ne 0) { Fail "Сервер $Server недоступен" }

Say 'Заливаю /opt/proxy и /opt/sites'
# tar из Windows: только конфиги и compose.yml, .env и certbot/ на сервере остаются как есть.
# Через cmd: конвейер PowerShell 5.1 между двумя программами портит двоичные данные
cmd /c "tar -cf - -C `"$root`" proxy sites | ssh $Server `"tar -xf - -C /opt --no-same-owner`""
if ($LASTEXITCODE -ne 0) { Fail 'Не удалось залить файлы' }

Say 'Поднимаю nginx, certbot, реестр'
ssh $Server "sed -i 's/\r$//' /opt/proxy/install.sh && sh /opt/proxy/install.sh"
if ($LASTEXITCODE -ne 0) { Fail 'Прокси не поднялся – вывод выше' }

if ($PortfolioEnv) {
    if (-not (Test-Path $PortfolioEnv)) { Fail "Нет файла $PortfolioEnv" }
    Say "Заливаю $PortfolioEnv как /opt/sites/portfolio/.env"
    scp -q $PortfolioEnv "${Server}:/opt/sites/portfolio/.env"
    ssh $Server "sed -i 's/\r$//' /opt/sites/portfolio/.env && chmod 600 /opt/sites/portfolio/.env"
}

if ($Cert) {
    Say "Выпускаю сертификат для $Cert"
    ssh $Server "sh /opt/proxy/cert.sh $Cert"
    if ($LASTEXITCODE -ne 0) { Fail 'Сертификат не выпущен – вывод выше' }
}
Say 'Готово'
