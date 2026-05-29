import type { SettingsState } from './types';

import { CONFIG } from 'src/global-config';
import { themeConfig } from 'src/theme/theme-config';

// ----------------------------------------------------------------------

export const SETTINGS_STORAGE_KEY: string = 'app-settings';

export const defaultSettings: SettingsState = {
  mode: themeConfig.defaultMode,
  direction: themeConfig.direction,
  contrast: 'default',
  navLayout: 'vertical',
  primaryColor: 'preset5', // Se cambio la configuración por defecto a preset5 (color morado)
  navColor: 'apparent', // Se cambio la configuración por defecto a 'apparent', para que la barra de navegación tenga un color visible
  compactLayout: false, // Se cambio la configuración por defecto a false, para que el layout no sea compacto
  fontSize: 16,
  fontFamily: themeConfig.fontFamily.primary,
  version: CONFIG.appVersion,
};
