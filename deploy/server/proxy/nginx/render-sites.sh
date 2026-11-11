#!/bin/sh
# Собирает /etc/nginx/conf.d/sites.conf из /etc/nginx/sites.list (= sites.conf в /opt/proxy).
# Есть сертификат домена – HTTP уводит на HTTPS; нет – сайт работает по HTTP, пока cert.sh не выпустит сертификат.
set -eu
out=/etc/nginx/conf.d/sites.conf
rm -f /etc/nginx/conf.d/default.conf
: > "$out"

sed 's/\r$//; s/#.*//' /etc/nginx/sites.list | while read -r upstream primary rest; do
    [ -n "${primary:-}" ] || continue
    names="$primary $rest"
    cert=/etc/letsencrypt/live/$primary

    if [ -f "$cert/fullchain.pem" ]; then
        cat >> "$out" <<EOF
server {
    listen 80;
    server_name $names;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$primary\$request_uri; }
}
server {
    listen 443 ssl;
    http2 on;
    server_name $names;
    ssl_certificate $cert/fullchain.pem;
    ssl_certificate_key $cert/privkey.pem;
    add_header Strict-Transport-Security "max-age=31536000" always;
    if (\$host != $primary) { return 301 https://$primary\$request_uri; }
    location / {
        set \$upstream http://$upstream;
        include /etc/nginx/proxy_params.conf;
    }
}
EOF
        echo "sites: https $names -> $upstream"
    else
        cat >> "$out" <<EOF
server {
    listen 80;
    server_name $names;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / {
        set \$upstream http://$upstream;
        include /etc/nginx/proxy_params.conf;
    }
}
EOF
        echo "sites: http  $names -> $upstream (сертификата нет)"
    fi
done
