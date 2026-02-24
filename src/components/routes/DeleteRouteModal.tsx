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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { routesApi } from '@/api/routes';
import { toast } from 'sonner';
import { useMapStore } from '@/hooks/useMapStore';
import { Route } from '@/types';
import { Loader2 } from 'lucide-react';

interface DeleteRouteModalProps {
  route: Route | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRouteModal({ route, open, onOpenChange }: DeleteRouteModalProps) {
  const queryClient = useQueryClient();
  const { deleteRoute } = useMapStore();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routesApi.delete(id),
    onSuccess: () => {
      if (route) {
        deleteRoute(route.id);
      }
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Xóa tuyến thành công!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Xóa tuyến thất bại!');
    },
  });

  const handleDelete = () => {
    if (route) {
      deleteMutation.mutate(route.id);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa tuyến</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa tuyến <strong>"{route?.name}"</strong>?
            <br />
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
