import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';
import fs from "fs";
import path from "path";
import { __dirname } from "#root/utils/dirname.js";

export const generateAvatar = async (name, filePath) => {
  const avatar = createAvatar(initials, {
    seed: name,
    textColor: ['646f77'],
    backgroundColor: ['939ca3'],
    radius: 50
  });

  console.log(name, filePath)
  const svg = avatar.toString();
  fs.writeFile(filePath, svg, (err) => {
    if(err) {
      throw err;
    } else {
      console.log("Avatar generated!");
    }
  });
}

/*const avatarPath = [
  {fullName: 'Иван Иванович', avatarPath: '/uploads/avatars/ivan_avatar.svg'},
  {fullName: 'Мария Сергеевна', avatarPath: '/uploads/avatars/maria_avatar.svg'},
  {fullName: 'Петр Алексеевич', avatarPath: '/uploads/avatars/petr_avatar.svg'},
  {fullName: 'Елена Викторовна', avatarPath: '/uploads/avatars/elena_avatar.svg'},
  {fullName: 'Алексей Дмитриевич', avatarPath: '/uploads/avatars/alexey_avatar.svg'},
  {fullName: 'Ольга Андреевна', avatarPath: '/uploads/avatars/olga_avatar.svg'},
  {fullName: 'Дмитрий Сергеевич', avatarPath: '/uploads/avatars/dmitry_avatar.svg'},
  {fullName: 'Наталья Ивановна', avatarPath: '/uploads/avatars/natalia_avatar.svg'},
  {fullName: 'Сергей Петрович', avatarPath: '/uploads/avatars/sergey_avatar.svg'},
  {fullName: 'Светлана Алексеевна', avatarPath: '/uploads/avatars/svetlana_avatar.svg'}
]

for (let i = 0; i < avatarPath.length; i++) {
  generateAvatar(avatarPath[i].fullName, path.join(__dirname, avatarPath[i].avatarPath));
}*/
