import { CONFIG } from 'src/global-config';

import { JobsMapView } from 'src/sections/architecture/business/positions/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Map Positions | Dashboard - ${CONFIG.appName}` };

type Params = { id: string };
type Props = { params: Promise<Params> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <JobsMapView id={id} />;
}
