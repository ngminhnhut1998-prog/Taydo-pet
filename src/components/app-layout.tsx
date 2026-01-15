"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Home, Users, HeartPulse, Calendar, Wifi, WifiOff, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { processSyncQueue, syncAllData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import { Badge } from './ui/badge';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const syncQueueCount = useLiveQuery(() => db.syncQueue.count(), []);

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Không thể đồng bộ khi không có kết nối mạng.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      await processSyncQueue();
      await syncAllData();
      toast({
        title: 'Đồng bộ thành công',
        description: 'Dữ liệu của bạn đã được cập nhật.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Lỗi đồng bộ',
        description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  React.useEffect(() => {
    if(isOnline){
      handleSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold">Thú Cưng Yêu</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/dashboard'}>
                  <Home />
                  Bảng điều khiển
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/khach-hang" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/khach-hang'}>
                  <Users />
                  Khách hàng
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/lich-hen" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/lich-hen'}>
                  <Calendar />
                  Lịch hẹn
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          {/* Footer content if needed */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span>Offline</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
            >
              <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
              <span className="sr-only">Đồng bộ</span>
            </Button>
            {syncQueueCount && syncQueueCount > 0 ? (
                 <Badge variant="destructive">{syncQueueCount}</Badge>
            ) : null}
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
