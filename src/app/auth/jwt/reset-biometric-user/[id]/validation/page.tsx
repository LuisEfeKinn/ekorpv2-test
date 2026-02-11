import { ResetBiometricUserView } from 'src/sections/reset-biometric-user/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Reset Biometric User` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <ResetBiometricUserView id={id} />;
}