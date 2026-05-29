import { BiometricSignInView } from 'src/sections/biometric-sign-in/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Biometric Sign In` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <BiometricSignInView id={id} />;
}