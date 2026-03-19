import { SkillsEditView } from 'src/sections/skills/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit Skills` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <SkillsEditView id={id} />;
}