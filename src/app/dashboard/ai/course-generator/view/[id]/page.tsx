import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiCoursesPreviewView } from 'src/sections/ai-course-generator/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `View AI Course - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <AiCoursesPreviewView id={id} />;
}
