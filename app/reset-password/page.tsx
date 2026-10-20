import { AuthPage } from '@/components/auth-page';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reset password', robots: { index: false, follow: false } };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = (await searchParams).token;
  return (
    <div id="main-content">
      <AuthPage mode="reset" token={typeof token === 'string' ? token : undefined} />
    </div>
  );
}
