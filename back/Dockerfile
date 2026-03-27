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

RUN printf '#!/bin/sh\nset -e\necho "DATABASE_URL=$DATABASE_URL" >&2\necho "Updating .env..." >&2\ncd /app\nif [ -z "$DATABASE_URL" ]; then\n  echo "ERROR: DATABASE_URL not set!" >&2\nelse\n  grep "^DATABASE_URL=" .env > /dev/null 2>&1 && sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env || echo "DATABASE_URL=$DATABASE_URL" >> .env\n  echo "DATABASE_URL in .env:" >&2\n  grep "^DATABASE_URL=" .env >&2\nfi\necho "Clearing caches..." >&2\nrm -rf bootstrap/cache/* storage/framework/cache/* storage/logs/* 2>/dev/null || true\nphp artisan config:clear --quiet\necho "Running migrations..." >&2\nphp artisan migrate --force --quiet\necho "Starting server..." >&2\nexec php artisan serve --host=0.0.0.0 --port=${PORT:-4000}\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
