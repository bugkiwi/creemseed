import { AuthPage } from '@/components/auth-page';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Forgot password', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <div id="main-content">
      <AuthPage mode="forgot" />
    </div>
  );
}
