import { EmploymentTypeEditView } from 'src/sections/employment-type/view/employment-type-edit';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit Employment Type` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <EmploymentTypeEditView id={id} />;
}