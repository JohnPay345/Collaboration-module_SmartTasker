import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Получить путь к файлу текущего модуля
const __filename = fileURLToPath("file://" + resolve("app.js"));

// Получить имя каталога
export const __dirname = dirname(__filename);