import { Eye, EyeOff, MoreVertical, User, Pencil, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/hooks/useMapStore';
import { RouteType, Route, PostOffice, ProductType, OperationalArea } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { DeleteRouteModal } from '../routes';
import { routeTypeLabels, routeTypeColors, productTypeOptions } from '@/constants';
import { CheckPointInput } from './CheckPointInput';

interface IProps {
  postOffices?: PostOffice[];
  operatingAreas?: OperationalArea[]; 
}

export function RouteListPanel({ postOffices, operatingAreas }: IProps) {
  const {
    routes,
    selectedRouteId,
    setSelectedRoute,
    toggleRouteVisibility,
    filterPostOfficeId,
    filterProductType,
    filterOperationalAreaId,
    setFilterPostOfficeId,
    setFilterProductType,
    setFilterOperationalAreaId,
    highlightedRouteIds,
    selectedOperationalAreaId,
    setSelectedOperationalArea,
  } = useMapStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [activeTab, setActiveTab] = useState<'routes' | 'areas'>('routes');

  // Set default post office to first item
  useEffect(() => {
    if (postOffices && postOffices.length > 0 && !filterPostOfficeId) {
      setFilterPostOfficeId(postOffices[0].id);
    }
  }, [postOffices, filterPostOfficeId, setFilterPostOfficeId]);

  const filteredRoutes = routes.filter((route) => {
    if (searchTerm && !route.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;    return true;
  });

  const filteredOperationalAreas = operatingAreas.filter((area) => {  // Filter by operationalAreaId if set
    if (filterOperationalAreaId && area.id !== filterOperationalAreaId) return false;    return true;
  });

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Check Point Input */}
          <CheckPointInput />
      {/* Header */}
      <div className="p-4 border-b border-border">
        {/* <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">
            {activeTab === 'routes' ? 'Danh sách Tuyến' : 'Danh sách Vùng hoạt động'}
          </h2>
        </div> */}
        {/* <Button size="sm" onClick={handleNewRoute} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" />
            Thêm
          </Button> */}

        {/* Search */}
        {/* <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tuyến..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div> */}

        {/* Filters */}
        <div className="space-y-2">
          {/* Post Office and Route Type Filters */}
          <div className="flex gap-2">
            <Select
              value={filterPostOfficeId || undefined}
              onValueChange={(v) => setFilterPostOfficeId(v)}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="Chọn bưu cục" />
              </SelectTrigger>
              <SelectContent>
                {postOffices?.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po?.name} ({po.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterProductType || 'all'}
              onValueChange={(v) => setFilterProductType(v === 'all' ? null : (v as ProductType))}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="Loại hàng hóa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại hàng hóa</SelectItem>
                {productTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operational Area Filter */}
          <div>
            <Select
              value={filterOperationalAreaId || 'all'}
              onValueChange={(v) => setFilterOperationalAreaId(v === 'all' ? null : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Vùng hoạt động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vùng hoạt động</SelectItem>
                {operatingAreas?.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'routes' | 'areas')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-transparent">
            <TabsTrigger 
              value="routes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none data-[state=active]:bg-transparent"
            >
              Tuyến
            </TabsTrigger>
            <TabsTrigger 
              value="areas"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none data-[state=active]:bg-transparent"
            >
              Vùng hoạt động
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List Content */}
      {activeTab === 'routes' ? (
        <>
          {/* Route List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const isHighlighted = highlightedRouteIds.includes(route.id);

              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(isSelected ? null : route.id, !isSelected)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-all duration-200 border',
                    isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                    isSelected
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-background border-transparent hover:bg-accent'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: route.color }}
                        />
                        <span className="font-medium text-sm truncate">{route.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('route-badge', routeTypeColors[route.type])}>
                          {routeTypeLabels[route.type]}
                        </span>
                        {route.productType && route.productType.length > 0 && (
                          <span className={cn('route-badge', 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300')}>
                            {route.productType.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRouteVisibility(route.id);
                        }}
                      >
                        {route.isVisible ? (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* <DropdownMenuItem>
                            <Pencil className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem> */}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRouteToDelete(route);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Employee */}
                  {route.assignedEmployeeName && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>{route.assignedEmployeeName}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRoutes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không tìm thấy tuyến</p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tổng: {filteredRoutes.length} tuyến</span>
              <span>Hiển thị: {filteredRoutes.filter((r) => r.isVisible).length}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Operational Areas List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredOperationalAreas.map((area) => {
              const isSelected = selectedOperationalAreaId === area.id;

              return (
                <div
                  key={area.id}
                  onClick={() => setSelectedOperationalArea(isSelected ? null : area.id, !isSelected)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-all duration-200 border',
                    isSelected
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-background border-transparent hover:bg-accent'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border border-purple-500 border-dashed"
                        />
                        <span className="font-medium text-sm truncate">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {area.postOfficeName && (
                          <span className="text-xs text-muted-foreground truncate">
                            {area.postOfficeName}
                          </span>
                        )}
                        {area.productType && area.productType.length > 0 && (
                          <span className={cn('route-badge', 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300')}>
                            {area.productType.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredOperationalAreas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không tìm thấy vùng hoạt động</p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tổng: {filteredOperationalAreas.length} vùng</span>
              <span>Hiển thị: {filteredOperationalAreas.filter((a) => a.isVisible).length}</span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteRouteModal
        route={routeToDelete}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
      />
    </div>
  );
}
