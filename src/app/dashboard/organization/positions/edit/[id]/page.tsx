import { PositionEditView } from 'src/sections/positions/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit Position` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <PositionEditView id={id} />;
}