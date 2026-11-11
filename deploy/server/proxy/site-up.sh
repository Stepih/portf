#!/bin/sh
# Поднимает сайт из свежих образов реестра: sh /opt/proxy/site-up.sh portfolio
# Вызывается из deploy.ps1 после push. Папка сайта – /opt/sites/<имя> (compose.yml + .env).
set -eu
site=${1:?Укажите сайт: portfolio или money}
dir=/opt/sites/$site
cd "$dir"
[ -f .env ] || { echo "Нет $dir/.env – заполните его (шаблон рядом: env.example)" >&2; exit 1; }
sed -i 's/\r$//' .env

docker compose pull --quiet
docker compose up -d --remove-orphans

# Ждём, пока контейнеры с healthcheck станут healthy (до 3 минут)
for _ in $(seq 1 60); do
    bad=$(docker compose ps --format '{{.Name}} {{.Health}}' | awk '$2 != "" && $2 != "healthy"')
    [ -z "$bad" ] && break
    sleep 3
done
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
if [ -n "$bad" ]; then
    echo "[!] Не поднялись: $bad – смотрите: cd $dir && docker compose logs --tail 100" >&2
    exit 1
fi

# Чистка: старые слои в docker и в реестре, чтобы диск не забивался от деплоя к деплою
docker image prune -f >/dev/null
docker compose -f /opt/proxy/compose.yml exec -T registry \
    registry garbage-collect --delete-untagged /etc/docker/registry/config.yml >/dev/null 2>&1 || true
echo "Сайт $site обновлён"
