import fs from 'node:fs';
import path from 'node:path';

// Путь к смонтированному файлу секретов в Docker
const SECRET_PATH = '/run/secrets/app_env_file';

if (fs.existsSync(SECRET_PATH)) {
  try {
    const fileContent = fs.readFileSync(SECRET_PATH, 'utf8');

    fileContent.split(/\r?\n/).forEach(line => {
      if (!line || line.trim().startsWith('#')) return;

      const firstEqual = line.indexOf('=');
      if (firstEqual === -1) return;

      const key = line.substring(0, firstEqual).trim();
      let value = line.substring(firstEqual + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key) {
        process.env[key] = value;
      }
    });

    console.log('[Docker Secrets]: Все секреты успешно загружены в process.env');
  } catch (error) {
    console.error('[Docker Secrets]: Ошибка при чтении файла секретов:', error.message);
  }
} else {
  console.log('[Docker Secrets]: Файл секретов не найден. Используются стандартные ENV.');
}
