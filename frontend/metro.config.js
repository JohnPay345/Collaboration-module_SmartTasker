const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Если кто-то (например, lib0) пытается импортировать упавший модуль
  // if (moduleName.startsWith('isomorphic-webcrypto')) {
  //   return context.resolveRequest(
  //     context,
  //     'expo-crypto', // Подменяем на установленный у вас рабочий expo-crypto
  //     platform
  //   );
  // }

  // Для всех остальных модулей используем стандартную логику Expo
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
