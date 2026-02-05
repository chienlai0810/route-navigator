import { Users, Search, MoreVertical, Phone, MapPin, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

const mockEmployees = [
  {
    id: 'emp-1',
    name: 'Nguyễn Văn A',
    phone: '0912 345 678',
    postOffice: 'BC-HN01',
    assignedRoutes: ['Tuyến Hoàn Kiếm A1'],
    status: 'active',
  },
  {
    id: 'emp-2',
    name: 'Trần Văn B',
    phone: '0923 456 789',
    postOffice: 'BC-HN01',
    assignedRoutes: ['Tuyến Hoàn Kiếm A2'],
    status: 'active',
  },
  {
    id: 'emp-3',
    name: 'Lê Thị C',
    phone: '0934 567 890',
    postOffice: 'BC-HN02',
    assignedRoutes: ['Tuyến Ba Đình B1'],
    status: 'active',
  },
  {
    id: 'emp-4',
    name: 'Phạm Văn D',
    phone: '0945 678 901',
    postOffice: 'BC-HN02',
    assignedRoutes: [],
    status: 'inactive',
  },
];

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = mockEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm)
  );

  return (
    <div className="h-full p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Quản lý Nhân viên
          </h1>
          <p className="text-muted-foreground">
            Danh sách nhân viên giao nhận trong hệ thống
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground">
          + Thêm nhân viên
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-80 mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm nhân viên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
                      {employee.name.split(' ').map((n) => n[0]).join('').slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{employee.name}</h3>
                    <Badge
                      variant={employee.status === 'active' ? 'default' : 'secondary'}
                      className={
                        employee.status === 'active'
                          ? 'status-active text-xs'
                          : 'text-xs'
                      }
                    >
                      {employee.status === 'active' ? 'Hoạt động' : 'Nghỉ phép'}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                    <DropdownMenuItem>Gán tuyến</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Xóa</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {employee.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {employee.postOffice}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Route className="w-4 h-4" />
                  {employee.assignedRoutes.length > 0
                    ? employee.assignedRoutes.join(', ')
                    : 'Chưa gán tuyến'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
        <span>Tổng: {mockEmployees.length} nhân viên</span>
        <span>•</span>
        <span>Hoạt động: {mockEmployees.filter((e) => e.status === 'active').length}</span>
        <span>•</span>
        <span>Đã gán tuyến: {mockEmployees.filter((e) => e.assignedRoutes.length > 0).length}</span>
      </div>
    </div>
  );
}
