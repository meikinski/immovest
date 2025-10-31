import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to the correct route
  redirect('/input-method');
}
