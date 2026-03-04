import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiCoursesEditView } from 'src/sections/ai-course-generator/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit AI Course - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <AiCoursesEditView id={id} />;
}
