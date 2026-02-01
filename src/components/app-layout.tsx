
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardPlus, Calendar, FileBarChart, LogOut, Moon, Sun, Settings, ChevronsLeft, ShoppingBasket } from 'lucide-react';

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
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { syncAllData } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { pb } from '@/lib/pocketbase';

const SidebarToggle = () => {
    const { toggleSidebar } = useSidebar();
    return (
        <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex h-9 w-9 shrink-0"
            onClick={toggleSidebar}
        >
            <ChevronsLeft className="h-5 w-5 transition-transform ease-in-out group-data-[state=collapsed]/sidebar-wrapper:rotate-180" />
            <span className="sr-only">Toggle sidebar</span>
        </Button>
    )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const { logout, user } = useAuth();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllData();
      toast({
        title: 'Đồng bộ hóa thành công',
        description: 'Dữ liệu đã được làm mới từ máy chủ.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Lỗi đồng bộ hóa',
        description: 'Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Đã đăng xuất',
      description: 'Bạn đã đăng xuất thành công.',
    });
  };

  // Sync data on initial load
  React.useEffect(() => {
    if (user) { // Only sync if user is logged in
      handleSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold transition-opacity duration-200 group-data-[state=collapsed]/sidebar-wrapper:opacity-0">TH vet</span>
          </Link>
          <SidebarToggle />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip="Bảng điều khiển">
                  <LayoutDashboard />
                  Bảng điều khiển
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/khach-hang" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/khach-hang'} tooltip="Khách hàng">
                  <Users />
                  Khách hàng
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/dieu-tri" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/dieu-tri'} tooltip="Tiếp nhận">
                  <ClipboardPlus />
                  Tiếp nhận
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/lich-hen" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/lich-hen'} tooltip="Lịch hẹn">
                  <Calendar />
                  Lịch hẹn
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/reports" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/reports'} tooltip="Báo cáo">
                  <FileBarChart />
                  Báo cáo
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/petshop" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/petshop'} tooltip="Petshop">
                  <ShoppingBasket />
                  Petshop
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/settings" legacyBehavior passHref>
                <SidebarMenuButton isActive={pathname === '/settings'} tooltip="Cài đặt">
                  <Settings />
                  Cài đặt
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 flex flex-col gap-2">
           <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton onClick={handleLogout} tooltip="Đăng xuất">
                  <LogOut />
                  Đăng xuất
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <SidebarTrigger className="sm:hidden" />
          <div className="flex items-center gap-4 ml-auto">
             <Button variant="ghost" size="icon" className="md:hidden">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    {user && user.avatar && <AvatarImage src={pb.getFileUrl(user, user.avatar)} alt={user.email} />}
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
