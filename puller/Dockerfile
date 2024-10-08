FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    cron

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install gd

COPY --from=composer /usr/bin/composer /usr/bin/composer
RUN composer self-update

WORKDIR /var/www/puller

COPY . /var/www/puller
COPY --chown=www-data:www-data . /var/www/puller

RUN chown -R www-data:www-data /var/www/puller \
    && chmod -R 755 /var/www/puller

RUN echo "*/3 * * * * /usr/local/bin/php /var/www/puller/index.php >> /var/log/cron.log 2>&1" > /etc/cron.d/my-crontab

RUN chmod 0644 /etc/cron.d/my-crontab

RUN crontab /etc/cron.d/my-crontab

RUN touch /var/log/cron.log

RUN sed -i 's/listen = .*/listen = 0.0.0.0:5002/' /usr/local/etc/php-fpm.d/zz-docker.conf

RUN composer install

EXPOSE 5002

CMD ["sh", "-c", "cron && php-fpm"]