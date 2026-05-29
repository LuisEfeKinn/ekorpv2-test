import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------
//comment test build
export default function Page() {
  redirect(paths.dashboard.architecture.organizationalStructureTable);
}

