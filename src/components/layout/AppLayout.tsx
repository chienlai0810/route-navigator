import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export function AppLayout() {
  // Load system config khi app khởi động
  // Tự động cập nhật vào store khi fetch thành công
  useSystemConfig();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
