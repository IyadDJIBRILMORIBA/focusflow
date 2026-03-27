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

RUN printf '#!/bin/sh\nset -e\necho "=== [BOOTSTRAP] DATABASE_URL=$DATABASE_URL ===" >&2\necho "=== [BOOTSTRAP] Updating .env with DATABASE_URL ===" >&2\nif [ -n "$DATABASE_URL" ]; then\n  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env\n  if ! grep -q "DATABASE_URL=" .env; then\n    echo "DATABASE_URL=$DATABASE_URL" >> .env\n  fi\nfi\necho "=== [BOOTSTRAP] Updated .env ===" >&2\ngrep "^DATABASE_URL=" .env || true >&2\nrm -rf bootstrap/cache/config.php storage/framework/cache/bootstrap.php 2>/dev/null || true\nphp artisan config:clear --quiet 2>/dev/null || true\nphp artisan cache:clear --quiet 2>/dev/null || true\nphp artisan migrate --force --quiet\necho "=== [BOOTSTRAP] All migrations complete, starting server ===" >&2\nexec php artisan serve --host=0.0.0.0 --port=${PORT:-4000}\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
