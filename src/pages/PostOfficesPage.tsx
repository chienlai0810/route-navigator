import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PostOffice, PostOfficePayload } from '@/types';
import { postOfficesApi } from '@/api/postOffices';
import { toast } from 'sonner';
import { PostOfficeForm, PostOfficesTable } from '@/components/post-offices';
import { DialogTrigger, Dialog } from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/useDebounce';

export default function PostOfficesPage() {
  const queryClient = useQueryClient();

  // Mutation for updating post office
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PostOfficePayload> }) =>
      postOfficesApi.updatePostOffice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-offices'] });
      toast.success('Cập nhật bưu cục thành công!');
    },
    onError: () => {
      toast.error('Cập nhật bưu cục thất bại!');
    },
  });

  // Mutation for creating post office
  const createMutation = useMutation({
    mutationFn: (data: PostOfficePayload) =>
      postOfficesApi.createPostOffice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-offices'] });
      toast.success('Thêm bưu cục mới thành công!');
    },
    onError: () => {
      toast.error('Thêm bưu cục thất bại!');
    },
  });

  // Mutation for deleting post office
  const deleteMutation = useMutation({
    mutationFn: (id: string) => postOfficesApi.deletePostOffice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-offices'] });
      toast.success('Xóa bưu cục thành công!');
    },
    onError: () => {
      toast.error('Xóa bưu cục thất bại!');
    },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<PostOffice | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<PostOffice | null>(null);

  // Debounce search term to avoid too many API calls
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  // Fetch post offices with search params
  const { data: postOffices = [], isLoading, error } = useQuery({
    queryKey: ['post-offices', debouncedSearch],
    queryFn: () => postOfficesApi.getAll({ search: debouncedSearch || undefined }),
  });

  // Stats calculations
  const stats = useMemo(() => ({
    total: postOffices.length,
    active: postOffices.filter((po) => po.status === 'ACTIVE').length,
    maintenance: postOffices.filter((po) => po.status === 'MAINTENANCE').length,
  }), [postOffices]);

  const handleOpenDialog = (office?: PostOffice) => {
    setEditingOffice(office || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset editingOffice khi đóng dialog
      setEditingOffice(null);
    }
  };

  const handleFormSubmit = (data: PostOfficePayload) => {
    if (editingOffice) {
      updateMutation.mutate({
        id: editingOffice.id,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (office: PostOffice) => {
    setOfficeToDelete(office);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (officeToDelete) {
      deleteMutation.mutate(officeToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setOfficeToDelete(null);
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Bưu cục</h1>
          <p className="text-muted-foreground">Quản lý thông tin các bưu cục trong hệ thống</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Thêm Bưu cục
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <PostOfficeForm
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        editingOffice={editingOffice}
        onSubmit={handleFormSubmit}
        isSubmitting={updateMutation.isPending || createMutation.isPending}
      />

      {/* Search */}
      <div className="relative w-80 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm bưu cục theo mã hoặc tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2">Không thể tải dữ liệu bưu cục</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['postOffices'] })}>
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <PostOfficesTable
            postOffices={postOffices}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
          />

          {/* Footer Stats */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Hiển thị {stats.total} bưu cục{debouncedSearch && ' (đã lọc)'}</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-active" />
                Hoạt động: {stats.active}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-maintenance" />
                Bảo trì: {stats.maintenance}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bưu cục{' '}
              <span className="font-semibold">{officeToDelete?.name}</span>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
