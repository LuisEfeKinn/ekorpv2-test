import { UserManagementEditView } from 'src/sections/users-managment/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit Employee` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <UserManagementEditView id={id} />;
}