import { Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore } from '@/hooks/useMapStore';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  const { postOffices, selectedPostOfficeId, setSelectedPostOffice } = useMapStore();

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Left Section - Post Office Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Bưu cục:</span>
          <Select
            value={selectedPostOfficeId || 'all'}
            onValueChange={(value) => setSelectedPostOffice(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[220px] bg-background">
              <SelectValue placeholder="Tất cả bưu cục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả bưu cục</SelectItem>
              {postOffices.map((po) => (
                <SelectItem key={po.id} value={po.id}>
                  <div className="flex items-center gap-2">
                    <span>{po.name}</span>
                    <Badge
                      variant={po.status === 'active' ? 'default' : 'secondary'}
                      className={
                        po.status === 'active'
                          ? 'bg-status-active/15 text-status-active text-xs'
                          : 'bg-status-maintenance/15 text-status-maintenance text-xs'
                      }
                    >
                      {po.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">Nguyễn Admin</p>
                <p className="text-xs text-muted-foreground">Quản trị viên</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
