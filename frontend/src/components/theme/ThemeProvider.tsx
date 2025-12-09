import React, { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Fetch settings on mount if not already loaded
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  useEffect(() => {
    if (settings?.theme) {
      const { primaryColor, secondaryColor, accentColor, backgroundColor } = settings.theme;

      // Apply CSS custom properties to the root element
      const root = document.documentElement;
      
      root.style.setProperty('--color-primary', primaryColor || '#3b82f6');
      root.style.setProperty('--color-secondary', secondaryColor || '#64748b');
      root.style.setProperty('--color-accent', accentColor || '#f59e0b');
      root.style.setProperty('--color-background', backgroundColor || '#ffffff');

      // Create lighter and darker variants
      root.style.setProperty('--color-primary-light', `${primaryColor}20`);
      root.style.setProperty('--color-primary-dark', adjustBrightness(primaryColor || '#3b82f6', -20));
      root.style.setProperty('--color-accent-light', `${accentColor}20`);
    }
  }, [settings]);

  return <>{children}</>;
};

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

export default ThemeProvider;
