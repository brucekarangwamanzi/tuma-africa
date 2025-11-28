import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export const useTheme = () => {
  const { settings } = useSettingsStore();

  useEffect(() => {
    if (settings?.theme) {
      const { primaryColor, secondaryColor, accentColor, backgroundColor } = settings.theme;
      
      // Apply CSS custom properties to the root element
      const root = document.documentElement;
      
      root.style.setProperty('--color-primary', primaryColor);
      root.style.setProperty('--color-secondary', secondaryColor);
      root.style.setProperty('--color-accent', accentColor);
      root.style.setProperty('--color-background', backgroundColor);
      
      // Create lighter and darker variants
      root.style.setProperty('--color-primary-light', `${primaryColor}20`);
      root.style.setProperty('--color-primary-dark', adjustBrightness(primaryColor, -20));
      root.style.setProperty('--color-secondary-light', `${secondaryColor}20`);
      root.style.setProperty('--color-accent-light', `${accentColor}20`);
    }
  }, [settings?.theme]);

  return settings?.theme;
};

// Helper function to adjust color brightness
const adjustBrightness = (color: string, amount: number): string => {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;
  
  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  
  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;
  
  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
};