import { CONFIG } from 'src/global-config';

import { SettingsNineboxView } from 'src/sections/performance/evaluate/ninebox/settings/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Nine Box Settings - ${CONFIG.appName}` };

export default function Page() {
  return <SettingsNineboxView />;
}