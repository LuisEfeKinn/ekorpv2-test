import type { SettingsState } from './types';

import { cookies } from 'next/headers';

import { defaultSettings, SETTINGS_STORAGE_KEY } from './settings-config';

// ----------------------------------------------------------------------

export async function detectSettings(
  storageKey: string = SETTINGS_STORAGE_KEY
): Promise<SettingsState> {
  try {
    const cookieStore = await cookies();

    const settingsStore = cookieStore.get(storageKey);

    if (!settingsStore?.value) {
      return defaultSettings;
    }

    try {
      return JSON.parse(settingsStore.value) as SettingsState;
    } catch {
      // Cookie value is malformed — fall back to defaults instead of crashing SSR.
      return defaultSettings;
    }
  } catch {
    // cookies() can throw in certain SSR contexts (e.g. static rendering).
    return defaultSettings;
  }
}
