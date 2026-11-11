#!/bin/sh
# Первый выпуск сертификата Let's Encrypt для сайта из sites.conf: sh /opt/proxy/cert.sh showmyworks.ru
# Запускать, когда A-записи домена уже указывают на этот сервер. Домены строки, которые смотрят не сюда
# (например, нет записи www), пропускаются с предупреждением. Продление – сам контейнер certbot.
set -eu
cd "$(dirname "$0")"
primary=${1:?Укажите основной домен из sites.conf}

line=$(sed 's/\r$//; s/#.*//' sites.conf | awk -v d="$primary" '$2 == d { $1 = ""; print }')
[ -n "$line" ] || { echo "В sites.conf нет строки с основным доменом $primary" >&2; exit 1; }

my_ip=$(curl -4 -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')
args=""
for name in $line; do
    ip=$(getent ahostsv4 "$name" | awk 'NR == 1 { print $1 }')
    if [ "$ip" = "$my_ip" ]; then
        args="$args -d $name"
    else
        echo "[!] $name указывает на '${ip:-ничего}', а сервер – $my_ip: пропускаю" >&2
        [ "$name" = "$primary" ] && { echo "Основной домен ещё не смотрит на сервер – выпуск отменён" >&2; exit 1; }
    fi
done

docker compose run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
    --cert-name "$primary" $args --expand \
    --agree-tos --register-unsafely-without-email --non-interactive

docker compose exec nginx sh -c '/docker-entrypoint.d/40-render-sites.sh && nginx -t && nginx -s reload'
echo "Готово: https://$primary"
