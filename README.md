# SmartTasker

Мобильное приложение для автоматизации задач управления проектами. Разрабатывается модуль
для совместной работы в качестве исходника взят курсовая работа MobileApp_SmartTasker -
https://github.com/JohnPay345/MobileApp_SmartTasker

## Описание
SmartTasker — это современное мобильное приложение для управления проектами, задачами, уведомлениями и командной работой. Приложение реализовано на React Native (Expo) с собственным backend (Fastify + PostgreSQL) и поддержкой Docker для локального и продакшн-развертывания.

## Основные возможности
- Просмотр и фильтрация проектов и задач
- Ведение статусов, приоритетов, прогресса выполнения
- Современный дизайн с поддержкой тем и кастомных шрифтов
- Профиль пользователя, смена пароля, настройки
- Push-уведомления (RabbitMQ)
- Адаптивный интерфейс и бургер-меню
- Интеграция с backend API (Fastify, PostgreSQL)

## Структура проекта
```
Practical PART_PM2-Course_irina-Rifovna/
  backend/      # Серверная часть (Node.js, Fastify, PostgreSQL, Docker)
  frontend/     # Мобильное приложение (React Native, Expo)
```

## Быстрый старт

### Backend (API + БД)
1. Перейдите в папку backend:
   ```bash
   cd backend
   ```
2. Запустите backend и базу данных через Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. API будет доступен на http://localhost:8080

### Frontend (Expo)
1. Перейдите в папку frontend:
   ```bash
   cd frontend
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите приложение:
   ```bash
   npm start - общая загрузка
   npm run android - загрузка в эмулятор Android
   npm run ios - загрузка в эмулятор IOS
   npm run web - загрузка на сайт
   ```
4. Откройте приложение на эмуляторе или устройстве через Expo Go.

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

## Технологии
- **Frontend:** React Native (Expo), TypeScript, React Navigation, React Query
- **Backend:** Node.js, Fastify, PostgreSQL, Docker, RabbitMQ
- **DevTools:** ESLint, Prettier, React Query Devtools

## Примечания
- Проект находится в стадии активной разработки и тестирования.
- Для работы push-уведомлений требуется запущенный RabbitMQ (см. backend/rabbitmq/).
- Все данные (проекты, задачи) в демо-режиме — mock, для реального использования подключите backend.

## Автор
Дипломная работа, 2026.
