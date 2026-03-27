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

RUN printf '#!/bin/sh\nset -e\necho "=== [BOOTSTRAP] Updating .env with Render vars ===" >&2\nif [ -n "$DB_URL" ]; then\n  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env || echo "DATABASE_URL=$DB_URL" >> .env\nfi\nif [ -n "$APP_ENV" ]; then\n  sed -i "s|^APP_ENV=.*|APP_ENV=$APP_ENV|" .env || echo "APP_ENV=$APP_ENV" >> .env\nelse\n  sed -i "s|^APP_ENV=.*|APP_ENV=production|" .env || echo "APP_ENV=production" >> .env\nfi\nsed -i "s|^DB_CONNECTION=.*|DB_CONNECTION=pgsql|" .env || echo "DB_CONNECTION=pgsql" >> .env\nrm -rf bootstrap/cache/config.php storage/framework/cache/bootstrap.php 2>/dev/null || true\nphp artisan config:clear --quiet 2>/dev/null || true\nphp artisan cache:clear --quiet 2>/dev/null || true\nphp artisan migrate --force --quiet\nphp artisan serve --host=0.0.0.0 --port=${PORT:-4000}\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
