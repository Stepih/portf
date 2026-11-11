#!/bin/sh
# Запускает setup-server.ps1 после заливки файлов: права, сеть web, nginx + certbot + реестр.
set -e
find /opt/proxy /opt/sites -type f \( -name '*.sh' -o -name '*.conf' -o -name '*.yml' -o -name 'env.example' \) -exec sed -i 's/\r$//' {} +
chmod +x /opt/proxy/*.sh /opt/proxy/nginx/*.sh
mkdir -p /opt/proxy/certbot/conf /opt/proxy/certbot/www
docker network inspect web >/dev/null 2>&1 || docker network create web >/dev/null
cd /opt/proxy
docker compose up -d --remove-orphans --quiet-pull
# tar заменяет файлы новыми, а смонтированные по одному файлы контейнер видит старыми – только перезапуск
# (простой ~1 с); при старте nginx заново собирает сайты из sites.conf
docker run --rm -v /opt/proxy:/p:ro -v /opt/proxy/certbot/conf:/etc/letsencrypt:ro nginx:1.29-alpine \
    sh -c 'cp /p/nginx/nginx.conf /etc/nginx/nginx.conf && cp /p/nginx/proxy_params.conf /etc/nginx/ && cp /p/sites.conf /etc/nginx/sites.list && sh /p/nginx/render-sites.sh >/dev/null && nginx -t -q' \
    || { echo "Конфиг nginx с ошибкой – nginx не перезапущен" >&2; exit 1; }
docker compose up -d --force-recreate nginx
sleep 2
docker compose logs --since 10s nginx 2>&1 | grep 'sites:' || true
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
