# Деплой на свой сервер

Сервер `root@2.31.105.139` (Ubuntu 24.04, 1 CPU, 1 ГБ RAM + swap 2 ГБ). На нём два сайта за одним nginx:

```
/opt/proxy            nginx :80/:443 + certbot + реестр образов (127.0.0.1:5000)   ← deploy/server/proxy
  sites.conf          какой домен в какой контейнер
/opt/sites/portfolio  showmyworks.ru: compose.yml + .env                          ← deploy/server/sites/portfolio
/opt/sites/money      money: postgres + strapi + next + maildev, compose.yml + .env ← deploy/server/sites/money
```

Образы собираются **на Windows** (на сервере `next build` не влезет в память) и уходят в реестр сервера через ssh-туннель: переносятся только изменённые слои. Нужны Docker Desktop и ключ `~\.ssh\id_ed25519` без пароля.

## Команды (из корня портфолио)

| Что | Команда |
|---|---|
| Деплой showmyworks.ru | `powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1` |
| Деплой money | `powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1 -Site money` (первый раз: `-Domain <домен>`) |
| С незакоммиченными правками | добавить `-Force` |
| Залить правки `deploy\server` (nginx, sites.conf, compose) | `powershell -ExecutionPolicy Bypass -File deploy\setup-server.ps1` |
| Сертификат HTTPS | `powershell -ExecutionPolicy Bypass -File deploy\setup-server.ps1 -Cert showmyworks.ru` |

Деплой берёт рабочую папку проекта: без `-Force` отказывается, если есть незакоммиченные правки. В образ попадает метка `commit=<хеш>`.

## Переезд домена с Vercel
1. `deploy.ps1` – сайт уже работает на сервере по HTTP (проверка: `curl -H "Host: showmyworks.ru" http://2.31.105.139/`).
2. В DNS: A-записи `showmyworks.ru` и `www` → `2.31.105.139` (вместо Vercel), дождаться обновления.
3. `setup-server.ps1 -Cert showmyworks.ru` – Let's Encrypt; дальше HTTP уводит на HTTPS, `www` – на основной домен. Продлевает сам контейнер certbot.

## Второй сайт (money)
1. В `deploy\server\proxy\sites.conf` раскомментировать строки money и вписать домен, затем `setup-server.ps1`.
2. `deploy.ps1 -Site money -Domain <домен>` – создаст `/opt/sites/money/.env` со случайными секретами (S3 и SMTP – из локального `money\.env`), соберёт Strapi и Next. Strapi – на `cms.<домен>`.
3. DNS: `<домен>`, `www`, `cms` → сервер; `setup-server.ps1 -Cert <домен>` и `-Cert cms.<домен>`; в `.env` поставить `SESSION_COOKIE_INSECURE=false`, затем `deploy.ps1 -Site money`.

Новый сайт: строка в `sites.conf`, папка в `deploy\server\sites\<имя>` с `compose.yml` (контейнер в сети `web` с alias из `sites.conf`), запись в `$sites` в `deploy.ps1`.

## На сервере
- Логи: `cd /opt/sites/portfolio && docker compose logs -f --tail 100`; nginx – `cd /opt/proxy && docker compose logs nginx`.
- Секреты: `/opt/sites/<сайт>/.env` (права 600), после правки – `sh /opt/proxy/site-up.sh <сайт>`.
- MailDev money: `ssh -L 1080:127.0.0.1:1080 root@2.31.105.139`, затем http://localhost:1080.
- Счётчики демо-чата живут в памяти контейнера (Upstash не нужен), сбрасываются при деплое.
