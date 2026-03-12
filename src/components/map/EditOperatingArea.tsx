import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, MapPin, Calendar, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useMapStore } from '@/hooks/useMapStore';
import { PostOffice } from '@/types';
import { operationalAreasApi, UpdateOperationalAreaPayload } from '@/api/operationalAreas';
import { productTypeOptions } from '@/constants';

interface IProps {
  postOffices?: PostOffice[];
}

const formSchema = z.object({
  name: z.string().min(1, 'Tên vùng hoạt động là bắt buộc'),
  postOfficeId: z.string().min(1, 'Bưu cục là bắt buộc'),
  productType: z.array(z.enum(['HH', 'KH', 'TH'] as const)).min(1, 'Chọn ít nhất một loại hàng hóa'),
});

type FormValues = z.infer<typeof formSchema>;

export function EditOperatingArea({ postOffices }: IProps) {
  const { 
    operationalAreas,
    selectedOperationalAreaId, 
    setSelectedOperationalArea,
    updateOperationalArea,
    setEditingOperationalAreaId,
    revertOperationalAreaPolygon,
    saveOriginalOperationalAreaPolygon,
    editMode,
    setEditMode,
  } = useMapStore();

  const area = operationalAreas.find((a) => a.id === selectedOperationalAreaId);
  console.log('area for editing:', area);
  const queryClient = useQueryClient();

  // Mutation for updating operational area
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOperationalAreaPayload }) => 
      operationalAreasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-areas'] });
      toast.success('Cập nhật vùng hoạt động thành công!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Cập nhật vùng hoạt động thất bại!');
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPolygon, setIsEditingPolygon] = useState(false);
  const previousAreaIdRef = useRef<string | null>(null);

  // Fetch operating area status to check if it can be updated
  const { data: areaStatus } = useQuery({
    queryKey: ['operating-area-status', selectedOperationalAreaId],
    queryFn: () => selectedOperationalAreaId ? operationalAreasApi.getStatus(selectedOperationalAreaId) : null,
    enabled: !!selectedOperationalAreaId,
  });

  const canUpdate = areaStatus?.canUpdate ?? true; // Default to true if status not loaded yet

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      postOfficeId: '',
      productType: [],
    },
  });

  // Update form when area changes
  useEffect(() => {
    if (area) {
      form.reset({
        name: area.name,
        postOfficeId: area.postOfficeId || '',
        productType: area.productType || [],
      });
    }
  }, [area, form]);

  // Sync editingOperationalAreaId and editMode with polygon editing state
  useEffect(() => {
    if (isEditingPolygon && selectedOperationalAreaId && editMode) {
      setEditingOperationalAreaId(selectedOperationalAreaId);
      // Save original polygon before editing
      if (area) {
        saveOriginalOperationalAreaPolygon(area.id, area.polygon);
      }
    } else {
      setEditingOperationalAreaId(null);
    }
  }, [isEditingPolygon, selectedOperationalAreaId, setEditingOperationalAreaId, editMode, area, saveOriginalOperationalAreaPolygon]);

  // Reset editing state when area changes
  useEffect(() => {
    if (previousAreaIdRef.current && previousAreaIdRef.current !== selectedOperationalAreaId && (isEditing || isEditingPolygon)) {
      revertOperationalAreaPolygon(previousAreaIdRef.current);
      setIsEditing(false);
      setIsEditingPolygon(false);
      setEditMode(null);
    }
    
    previousAreaIdRef.current = selectedOperationalAreaId;
  }, [selectedOperationalAreaId, isEditing, isEditingPolygon, revertOperationalAreaPolygon, setEditMode]);

  if (!area) return null;

  const postOffice = postOffices?.find((po) => po.id === area.postOfficeId);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditVertices = () => {
    setIsEditingPolygon(true);
    setEditMode('vertices');
  };

  const handleEditDrag = () => {
    setIsEditingPolygon(true);
    setEditMode('drag');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingPolygon(false);
    setEditMode(null);
    // Revert polygon to original state
    if (area) {
      revertOperationalAreaPolygon(area.id);
      form.reset({
        name: area.name,
        postOfficeId: area.postOfficeId || '',
        productType: area.productType || [],
      });
    }
  };

  // Convert internal polygon format to GeoJSON Polygon format
  const convertPolygonToArea = (polygon: Array<{ lat: number; lng: number }>) => {
    const coordinates = polygon.map(point => [point.lng, point.lat] as [number, number]);
    
    if (coordinates.length > 0) {
      const firstPoint = coordinates[0];
      const lastPoint = coordinates[coordinates.length - 1];
      
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coordinates.push([firstPoint[0], firstPoint[1]]);
      }
    }
    
    return {
      type: 'Polygon' as const,
      coordinates: [coordinates]
    };
  };

  const handleSave = async (values: FormValues) => {
    if (!area) return;

    // Get fresh area data (includes updated polygon if edited)
    const currentArea = operationalAreas.find((a) => a.id === area.id);
    if (!currentArea) return;

    // Convert productType array to semicolon-separated string
    const productTypeString = values.productType.join(';');

    // Create payload for API with current polygon data
    const payload: UpdateOperationalAreaPayload = {
      name: values.name.trim(),
      postOfficeId: values.postOfficeId,
      productType: productTypeString,
      area: convertPolygonToArea(currentArea.polygon),
    };

    try {
      await updateMutation.mutateAsync({ id: currentArea.id, data: payload });

      // Update local store
      updateOperationalArea(currentArea.id, {
        name: values.name.trim(),
        postOfficeId: values.postOfficeId,
        productType: values.productType,
      });

      setIsEditing(false);
      setIsEditingPolygon(false);
      setEditMode(null);
    } catch (error) {
      console.error('Failed to update operational area:', error);
    }
  };

  const handleClose = () => {
    // Revert polygon if currently editing
    if ((isEditing || isEditingPolygon) && area) {
      revertOperationalAreaPolygon(area.id);
      setIsEditing(false);
      setIsEditingPolygon(false);
      setEditMode(null);
    }
    setSelectedOperationalArea(null);
  };

  return (
    <div className="w-80 info-panel animate-slide-in-right flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">{isEditing || isEditingPolygon ? 'Chỉnh sửa Vùng hoạt động' : 'Chi tiết Vùng hoạt động'}</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {!isEditing && (
          <>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleEdit}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Chỉnh sửa
              </Button>
            </div>
          </>
        )}
        {isEditing && (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleEditVertices}
              disabled={!canUpdate}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Sửa đỉnh
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleEditDrag}
              disabled={!canUpdate}
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Di chuyển
            </Button>
          </div>
        )}
        {/* {isEditing && !canUpdate && areaStatus?.message && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            {areaStatus.message}
          </div>
        )} */}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {isEditing ? (
          // Edit Mode
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên vùng hoạt động *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Vùng KH Cầu Giấy 01"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Type */}
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại hàng hóa *</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={productTypeOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Chọn loại hàng hóa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Post Office */}
              <FormField
                control={form.control}
                name="postOfficeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bưu cục *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn bưu cục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {postOffices?.map((po) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.name} ({po.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          // View Mode
          <>
            {/* Area Name */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full border border-purple-500 border-dashed"
                />
                <h3 className="font-semibold text-lg">{area.name}</h3>
              </div>
              <div className="space-y-2">
                {area.productType && area.productType.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Loại hàng hóa:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {area.productType.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              {/* Post Office */}
              {area.postOfficeId && postOffice && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Bưu cục</span>
                  </div>
                  <p className="font-medium">{postOffice.name}</p>
                  <p className="text-xs text-muted-foreground">{postOffice.code}</p>
                </div>
              )}

              {/* Dates */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Thời gian</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Tạo:</span>
                    <p className="font-medium">{area.createdAt.toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cập nhật:</span>
                    <p className="font-medium">{area.updatedAt.toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer - Show only in edit mode */}
      {isEditing && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleCancel} 
              type="button"
              disabled={updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button 
              className="flex-1 gradient-primary" 
              onClick={form.handleSubmit(handleSave)}
              disabled={!form.formState.isValid || updateMutation.isPending}
              type="button"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
