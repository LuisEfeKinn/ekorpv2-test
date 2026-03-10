import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { SkillsView } from 'src/sections/skills/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Skills - ${CONFIG.appName}` };

export default function Page() {
  return <SkillsView />;
}