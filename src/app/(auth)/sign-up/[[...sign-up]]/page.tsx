import { SignUpSeite } from '@/components/auth/SignUpSeite';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const erster = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <SignUpSeite source={erster(params.source)} redirectUrl={erster(params.redirect_url)} />;
}
