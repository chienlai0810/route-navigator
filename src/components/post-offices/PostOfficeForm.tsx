import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PostOffice, PostOfficePayload } from '@/types';
import { useEffect } from 'react';

// Zod validation schema
const postOfficeSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã bưu cục không được để trống')
    .regex(
      /^[A-Z0-9_-]+$/,
      'Mã chỉ được chứa chữ hoa, số, gạch dưới (_) và gạch ngang (-)'
    ),
  name: z.string().min(3, 'Tên bưu cục phải có ít nhất 3 ký tự'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  phone: z.string().regex(/^[0-9\s]+$/, 'Số điện thoại không hợp lệ').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
  lat: z.number().min(-90).max(90, 'Vĩ độ phải trong khoảng -90 đến 90'),
  lng: z.number().min(-180).max(180, 'Kinh độ phải trong khoảng -180 đến 180'),
});

type PostOfficeFormData = z.infer<typeof postOfficeSchema>;

interface PostOfficeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOffice: PostOffice | null;
  onSubmit: (data: PostOfficePayload) => void;
  isSubmitting: boolean;
}

export function PostOfficeForm({
  open,
  onOpenChange,
  editingOffice,
  onSubmit,
  isSubmitting,
}: PostOfficeFormProps) {
  const form = useForm<PostOfficeFormData>({
    resolver: zodResolver(postOfficeSchema),
    defaultValues: {
      code: '',
      name: '',
      address: '',
      phone: '',
      status: 'ACTIVE',
      lat: 21.0285,
      lng: 105.8542,
    },
  });

  useEffect(() => {
    if (open) {
      // Khi mở dialog, load dữ liệu
      if (editingOffice) {
        form.reset({
          code: editingOffice.code,
          name: editingOffice.name,
          address: editingOffice.address,
          phone: editingOffice.phone,
          status: editingOffice.status,
          lat: editingOffice.location.coordinates[1],
          lng: editingOffice.location.coordinates[0],
        });
      } else {
        form.reset({
          code: '',
          name: '',
          address: '',
          phone: '',
          status: 'ACTIVE',
          lat: 21.0285,
          lng: 105.8542,
        });
      }
    } else {
      // Khi đóng dialog, reset về trạng thái ban đầu và clear errors
      form.reset({
        code: '',
        name: '',
        address: '',
        phone: '',
        status: 'ACTIVE',
        lat: 21.0285,
        lng: 105.8542,
      });
      form.clearErrors();
    }
  }, [open, editingOffice, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      code: data.code,
      name: data.name,
      address: data.address,
      phone: data.phone,
      status: data.status,
      location: {
        type: "Point",
        coordinates: [data.lng, data.lat],
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingOffice ? 'Chỉnh sửa Bưu cục' : 'Thêm Bưu cục mới'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã bưu cục</FormLabel>
                    <FormControl>
                      <Input placeholder="BC-HN01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="024 3825 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên bưu cục</FormLabel>
                  <FormControl>
                    <Input placeholder="Bưu cục Hoàn Kiếm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="15 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vĩ độ (Lat)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kinh độ (Lng)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <FormLabel>Trạng thái hoạt động</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {field.value === 'ACTIVE' ? 'Đang hoạt động' : 'Đang bảo trì'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'ACTIVE'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'ACTIVE' : 'MAINTENANCE')
                        }
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                className="gradient-primary text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingOffice ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
