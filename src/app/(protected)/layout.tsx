import { AppLayout } from '@/components/app-layout';

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
