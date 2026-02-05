import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, MoreVertical, MapPin, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMapStore } from '@/hooks/useMapStore';
import { PostOffice } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PostOfficesPage() {
  const { postOffices, updatePostOffice, addPostOffice } = useMapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<PostOffice | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    status: 'active' as 'active' | 'maintenance',
    lat: 21.0285,
    lng: 105.8542,
  });

  const filteredOffices = postOffices.filter(
    (po) =>
      po.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (office?: PostOffice) => {
    if (office) {
      setEditingOffice(office);
      setFormData({
        code: office.code,
        name: office.name,
        address: office.address,
        phone: office.phone,
        status: office.status,
        lat: office.coordinates.lat,
        lng: office.coordinates.lng,
      });
    } else {
      setEditingOffice(null);
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        status: 'active',
        lat: 21.0285,
        lng: 105.8542,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingOffice) {
      updatePostOffice(editingOffice.id, {
        code: formData.code,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        status: formData.status,
        coordinates: { lat: formData.lat, lng: formData.lng },
      });
      toast.success('Cập nhật bưu cục thành công!');
    } else {
      addPostOffice({
        id: `po-${Date.now()}`,
        code: formData.code,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        status: formData.status,
        coordinates: { lat: formData.lat, lng: formData.lng },
      });
      toast.success('Thêm bưu cục mới thành công!');
    }
    setIsDialogOpen(false);
  };

  const toggleStatus = (id: string, currentStatus: 'active' | 'maintenance') => {
    updatePostOffice(id, {
      status: currentStatus === 'active' ? 'maintenance' : 'active',
    });
    toast.success('Cập nhật trạng thái thành công!');
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Bưu cục</h1>
          <p className="text-muted-foreground">Quản lý thông tin các bưu cục trong hệ thống</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Thêm Bưu cục
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingOffice ? 'Chỉnh sửa Bưu cục' : 'Thêm Bưu cục mới'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã bưu cục</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BC-HN01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="024 3825 1234"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Tên bưu cục</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Bưu cục Hoàn Kiếm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="15 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Vĩ độ (Lat)</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.0001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Kinh độ (Lng)</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.0001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label>Trạng thái hoạt động</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.status === 'active' ? 'Đang hoạt động' : 'Đang bảo trì'}
                  </p>
                </div>
                <Switch
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, status: checked ? 'active' : 'maintenance' })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">
                  {editingOffice ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-80 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm bưu cục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">Mã BC</TableHead>
              <TableHead>Tên bưu cục</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead className="w-[140px]">Điện thoại</TableHead>
              <TableHead className="w-[120px]">Trạng thái</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffices.map((office) => (
              <TableRow key={office.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    {office.code}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{office.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-[250px]">{office.address}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {office.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      'cursor-pointer',
                      office.status === 'active'
                        ? 'status-active'
                        : 'status-maintenance'
                    )}
                    onClick={() => toggleStatus(office.id, office.status)}
                  >
                    {office.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(office)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Vô hiệu hóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Hiển thị {filteredOffices.length} / {postOffices.length} bưu cục</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-active" />
            Hoạt động: {postOffices.filter((po) => po.status === 'active').length}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-maintenance" />
            Bảo trì: {postOffices.filter((po) => po.status === 'maintenance').length}
          </span>
        </div>
      </div>
    </div>
  );
}
