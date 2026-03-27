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

# Create a custom php.ini to ensure environment variables are available
RUN echo "variables_order = \"EGPCS\"" >> /usr/local/etc/php/conf.d/laravel.ini && \
    echo "display_errors = Off" >> /usr/local/etc/php/conf.d/laravel.ini

RUN printf '#!/bin/sh\nset -a\nsource /proc/self/environ | tr "\\000" "\\n" > /tmp/env.source\nset +a\nset -e\necho "=== [BOOTSTRAP] Starting Laravel with Render PostgreSQL ===" >&2\necho "DATABASE_URL=$DATABASE_URL" >&2\nrm -rf bootstrap/cache/config.php storage/framework/cache/bootstrap.php 2>/dev/null || true\nphp artisan config:clear --quiet 2>/dev/null || true\nphp artisan cache:clear --quiet 2>/dev/null || true\nphp artisan migrate --force --quiet\necho "=== [BOOTSTRAP] All migrations complete, starting server ===" >&2\nexec php artisan serve --host=0.0.0.0 --port=${PORT:-4000}\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
