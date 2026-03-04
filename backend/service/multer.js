import multer from "fastify-multer";
import path from "path";
import { __dirname } from "#root/utils/dirname.js";

// Настройка хранилища для аватарок
const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, "uploads", "avatars"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

export const uploadAvatars = multer({ storage: avatarStorage });

// TODO: Настройки хранилища для документов и временнных файлов