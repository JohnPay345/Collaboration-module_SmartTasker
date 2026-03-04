# Используем образ линукс Alpine с версией node 22
FROM node:22-alpine

# Указываем нашу рабочую директорию
WORKDIR /app

# Скорировать package.json и package-lock.json внутрь контейнера
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем оставшиеся приложения в контейнер
COPY . . 

# Открыть порт в нашем контейнер
EXPOSE 8081

# Запускаем наш сервер
CMD ["npm", "start"]

VOLUME /app