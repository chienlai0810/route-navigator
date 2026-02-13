import { Edit2, Trash2, MoreVertical, MapPin, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { PostOffice } from '@/types';
import { cn } from '@/lib/utils';

interface PostOfficesTableProps {
  postOffices: PostOffice[];
  onEdit: (office: PostOffice) => void;
  onDelete?: (office: PostOffice) => void;
}

export function PostOfficesTable({
  postOffices,
  onEdit,
  onDelete,
}: PostOfficesTableProps) {
  return (
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
          {postOffices.map((office) => (
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
                    office.status === 'ACTIVE'
                      ? 'status-active'
                      : 'status-maintenance'
                  )}
                >
                  {office.status === 'ACTIVE'
                    ? 'Hoạt động'
                    : office.status === 'MAINTENANCE'
                    ? 'Bảo trì'
                    : 'Không hoạt động'}
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
                    <DropdownMenuItem onClick={() => onEdit(office)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(office)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
