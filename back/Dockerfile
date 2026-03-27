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

CMD ["sh", "-c", "php artisan config:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-4000}"]
