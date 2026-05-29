import { RiskTableMapView } from 'src/sections/architecture/risk/risk-table/view';

type Params = { id: string };
type Props = { params: Promise<Params> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <RiskTableMapView id={id} />;
}
