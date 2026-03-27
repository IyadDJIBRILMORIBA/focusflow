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
echo '=== [BOOTSTRAP] Updating .env with Render vars ===' >&2; \
\
if [ -n \"\\$DB_URL\" ]; then \
  sed -i \"s|^DATABASE_URL=.*|DATABASE_URL=\\${DB_URL}|\" .env || echo \"DATABASE_URL=\\${DB_URL}\" >> .env; \
fi; \
\
if [ -n \"\\$APP_ENV\" ]; then \
  sed -i \"s|^APP_ENV=.*|APP_ENV=\\${APP_ENV}|\" .env || echo \"APP_ENV=\\${APP_ENV}\" >> .env; \
else \
  sed -i \"s|^APP_ENV=.*|APP_ENV=production|\" .env || echo \"APP_ENV=production\" >> .env; \
fi; \
\
sed -i \"s|^DB_CONNECTION=.*|DB_CONNECTION=pgsql|\" .env || echo \"DB_CONNECTION=pgsql\" >> .env; \
\
rm -rf bootstrap/cache/config.php storage/framework/cache/bootstrap.php 2>/dev/null || true; \
php artisan config:clear --quiet 2>/dev/null || true; \
php artisan cache:clear --quiet 2>/dev/null || true; \
\
php artisan migrate --force --quiet; \
php artisan serve --host=0.0.0.0 --port=\${PORT:-4000}"]
