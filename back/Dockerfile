FROM php:8.4-cli-alpine

RUN apk add --no-cache git unzip icu-dev oniguruma-dev libzip-dev postgresql-dev postgresql-client
RUN docker-php-ext-install pdo_mysql pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

RUN cp -n .env.example .env || true
RUN php artisan key:generate --force

EXPOSE 4000

CMD ["sh", "-c", "set -e; \
\
echo '=== [DIAGNOSTIC] ENV VARS AVAILABLE ===' >&2; \
echo 'DB_URL='${DB_URL} >&2; \
echo 'DATABASE_URL='${DATABASE_URL} >&2; \
echo 'RENDER_POSTGRESQL_INTERNAL_URL='${RENDER_POSTGRESQL_INTERNAL_URL} >&2; \
echo 'RENDER_POSTGRESQL_URL='${RENDER_POSTGRESQL_URL} >&2; \
echo 'RENDER_POSTGRESQL_HOST='${RENDER_POSTGRESQL_HOST} >&2; \
echo 'PGHOST='${PGHOST} >&2; \
echo 'PGUSER='${PGUSER} >&2; \
echo 'PGPORT='${PGPORT} >&2; \
echo 'PGDATABASE='${PGDATABASE} >&2; \
echo '=====================================' >&2; \
\
export APP_ENV=${APP_ENV:-production}; \
export APP_DEBUG=${APP_DEBUG:-false}; \
export DB_CONNECTION=pgsql; \
export DB_URL=${DB_URL:-${DATABASE_URL:-${RENDER_POSTGRESQL_INTERNAL_URL:-${RENDER_POSTGRESQL_URL:-}}}}; \
\
rm -rf bootstrap/cache/config.php storage/framework/cache/bootstrap.php 2>/dev/null || true; \
php artisan config:clear --quiet 2>/dev/null || true; \
php artisan cache:clear --quiet 2>/dev/null || true; \
\
php artisan migrate --force --quiet; \
php artisan serve --host=0.0.0.0 --port=${PORT:-4000}"]
