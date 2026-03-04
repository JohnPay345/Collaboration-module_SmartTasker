import { useFonts as useExpoFonts } from 'expo-font';

export const useFonts = () => {
  const [fontsLoaded] = useExpoFonts({
    'Century-Regular': require('@src/assets/fonts/Century-Regular.ttf'),
    'Century-Bold': require('@src/assets/fonts/Century-Bold.ttf'),
    'Century-Italic': require('@src/assets/fonts/Century-Italic.ttf'),
    'Century-Italic-Bold': require('@src/assets/fonts/Century-Italic-Bold.ttf'),
  });

  return { fontsLoaded };
}; 