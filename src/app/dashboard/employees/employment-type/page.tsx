import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EmploymentTypeView } from 'src/sections/employment-type/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Type Employment - ${CONFIG.appName}` };

export default function Page() {
  return <EmploymentTypeView />;
}