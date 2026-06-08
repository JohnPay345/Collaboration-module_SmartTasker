# SmartTasker

Мобильное приложение для автоматизации задач управления проектами. Разрабатывается модуль
для совместной работы в качестве исходника используется курсовая работа MobileApp_SmartTasker -
https://github.com/JohnPay345/MobileApp_SmartTasker

## Описание

SmartTasker — это современное мобильное приложение для управления проектами, задачами, уведомлениями и командной работой. Приложение реализовано на React Native (Expo) с собственным backend (Fastify + PostgreSQL) и поддержкой Docker для локального и продакшн-развертывания.

## Основные возможности

- Просмотр и фильтрация проектов и задач
- Ведение статусов, приоритетов, прогресса выполнения
- Современный дизайн с поддержкой тем и кастомных шрифтов
- Профиль пользователя, смена пароля, настройки
- Push-уведомления
- Адаптивный интерфейс и бургер-меню
- Интеграция с backend API (Fastify, PostgreSQL)

## Структура проекта

```
Practical PART_PM2-Course_irina-Rifovna/
  backend/      # Серверная часть (Node.js, Fastify, PostgreSQL, Docker)
  frontend/     # Мобильное приложение (React Native, Expo)
```

## Быстрый старт

Переда началом работы вам потребуется установить Docker либо как Desktop, либо как CLI
(Command Line Interface). Помимо этого требуется установить NodeJS версии 18+. Если вы
хотите работать с frontend через эмулятор вам потребуется установить Android Studio для
запуска эмулятора и воспроизведения на нём через Expo Go клиентской части.

### Backend (API + БД)

1. Перейдите в папку backend:
   ```bash
   cd backend
   ```
2. Переименуйте файлы .env.example.development и .env.example.production в
   .env.development и.env.production
3. В переменных окружения укажите свои данные, там где нужно
4. Создайте папку secrets с содержимым:
   - psql_root_user_pass
   - rm_user
   - rm_pass
   - redis_pass
5. Добавьте в созданные файлы свои значения
6. Для работы Nginx требуется создать в папке nginx ещё папку certs, где требуется создать при помощи openssl
   сертификат с ключом и dhparam.pem. Откройте папку certs в консоли и выполните следующие команды:

   ```
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./smarttasker.key -out ./smarttasker.crt

   openssl dhparam -out ./dhparam.pem 2048

   ```

7. Выполните шаги по пункту [Об Push уведомлениях](#об-push-уведомлениях)
8. Запустите backend через Docker Compose:
   ```bash
   docker-compose up --build
   ```
9. API будет доступен на https://localhost:443, http://localhost:80

### Frontend (Expo)

1. Перейдите в папку frontend:
   ```bash
   cd frontend
   ```
2. Переименуйте файл .env.example.development и .env.example.production в .env.development и .env.production
3. Внутри них изменить EXPO_PUBLISH_BASE_URL на свой IP адрес или домен
4. Следуйте пункту [Об Push уведомлениях](#об-push-уведомлениях), если вы его не делали
5. Установите зависимости:
   ```bash
   npm install
   ```
6. Запустите приложение:
   ```bash
   npm start - общая загрузка
   npm run android - загрузка в эмулятор Android
   npm run ios - загрузка в эмулятор IOS
   npm run web - загрузка на сайт
   ```
7. Откройте приложение на эмуляторе или устройстве через Expo Go.

## Сборка APK для Android

### Через облако (Expo EAS Build)

1. Установите EAS CLI (если не установлен):
   ```bash
   npm install -g eas-cli
   ```
2. Войдите в аккаунт Expo:
   ```bash
   eas login
   ```
3. Инициализируйте EAS (один раз на проект):
   ```bash
   eas build:configure
   ```
4. Запустите сборку APK:
   ```bash
   eas build -p android --profile production --output-format apk
   ```
   > Если файла eas.json нет — создайте его в корне frontend:
   >
   > ```json
   > {
   >   "build": {
   >     "production": {
   >       "android": { "buildType": "apk" }
   >     }
   >   }
   > }
   > ```
5. Дождитесь завершения сборки и скачайте APK по ссылке из консоли.

### Локальная сборка (Windows/macOS/Linux)

1. Установите Android Studio и настройте переменные среды (ANDROID_HOME).
2. Запустите:
   ```bash
   eas build -p android --profile production --local --output-format apk
   ```
3. APK-файл появится в папке dist или по ссылке в консоли.

**Документация:**

- [Expo EAS Build (официально)](https://docs.expo.dev/build/android-builds/)
- [Expo: Как собрать APK](https://docs.expo.dev/build-reference/apk/)

## Об Push уведомлениях

Для работы Push уведомлений требуется запустить приложение на устройстве пользователя,
не эмулятор ([APK](#сборка-apk-для-android)). Также потребуется зарегистрироваться на площадке
Firebase Cloud Messaging ([FCM](https://firebase.google.com/)). Следующими шагами будет настройка окружения для push:

### Backend

1. Зайти в консоль FCM и создать проект
2. Перейти в настройки проекта и сгенерировать файл конфигурации
   (Settings &rarr; General &rarr; Service Accounts &rarr; Generate new private key)
3. После генерации переместить его на backend и переименовать в push-smarttasker.json

### Frontend

1. Зайти в консоль FCM и выбрать проект
2. Нажать на "Add app" на главном экране проекта
3. Добавить устройство Android и ввести такие значения:
   - Android package name: com.gregory12.smarttasker
   - Add nickname (опционально): SmartTasker
4. Нажать далее и скачать сгенерированный конфиг
5. Конфиг следует переместить в frontend, он будет использоваться при билде APK

## Технологии

- **Frontend:** React Native (Expo), TypeScript, Expo Router, React Query
- **Backend:** Node.js, Fastify, PostgreSQL, Docker, RabbitMQ, Nginx, Redis
- **DevTools:** ESLint, Prettier, React Query Devtools

## Примечания

- Проект находится в стадии активной разработки и тестирования.
- Для работы push-уведомлений требуется запущенный RabbitMQ (см. backend/rabbitmq/)
- Если планируете протестировать Push уведомления нужно следовать
  пункту "Об Push уведомлениях"
- Все данные (проекты, задачи) в демо-режиме — mock, для реального использования подключите backend.

## ⚠️ Важные нативные исправления и патчи (Troubleshooting)

В проекте используются патчи для исправления критических ошибок сборки и инициализации нативных модулей в **Release-сборках** Android. Все патчи зафиксированы с помощью `patch-package`.

### 1. Проблема с синхронизацией YJS / SyncedStore (`lib0`)

#### Описание проблемы:
В релизных APK-сборках Android приложение критически падало (или уходило в бесконечный `SplashScreen`) при переходе на экраны совместной работы (задачи, проекты). Причина — библиотека `lib0` (зависимость `yjs`) пытается синхронно вызвать генератор случайных чисел `global.crypto.getRandomValues()`. 
* В среде React Native (движок Hermes) этого API нативно нет.
* Попытки использовать асинхронные веб-полифилы (вроде `isomorphic-webcrypto`) ломали синхронный поток `yjs` требованием вызвать `await crypto.ensureSecure()`.

#### Решение (Текущее):
Был применен патч к модулю `lib0` через `patch-package`. Файл `node_modules/lib0/dist/webcrypto.react-native.cjs` переписан на использование **`expo-crypto`**, который предоставляет честный нативный синхронный метод `ExpoCrypto.getRandomBytes()`. Патч строго соответствует спецификации `'use strict'`.

#### 🔮 Альтернативы на будущее (Технический долг):
Если в будущем этот патч начнет конфликтовать при обновлении зависимостей, рекомендуется рассмотреть следующие альтернативы:
1. **Переход на официальный нативный полифил:** Установить пакет `react-native-get-random-values` (требует нативной компиляции C++/Java) и гарантированно импортировать его на самой первой строчке в корне бандла (до инициализации Expo Router), защитив его класс в `proguard-rules.pro` (`-keep class com.reactnativegetrandomvalues.** { *; }`).
2. **Отказ от `lib0` / Обновление `yjs`:** Проверить, вышли ли новые версии `yjs`/`syncedstore`, которые поддерживают кастомные провайдеры криптографии, не завязанные на браузерный `global.crypto`.

## ПРИЛОЖЕНИЕ

## Автор

Дипломная работа, 2026.
