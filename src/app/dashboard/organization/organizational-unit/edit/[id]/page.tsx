import { OrganizationEditView } from 'src/sections/organization/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit Organization` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <OrganizationEditView id={id} />;
}