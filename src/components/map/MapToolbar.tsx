import {
  MousePointer2,
  Pentagon,
  Edit3,
  Move,
  Trash2,
  Undo2,
  Redo2,
  Save,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/hooks/useMapStore';
import { DrawingTool } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tools: { id: DrawingTool; icon: typeof MousePointer2; label: string; shortcut?: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Chọn', shortcut: 'V' },
  { id: 'draw', icon: Pentagon, label: 'Vẽ tuyến mới', shortcut: 'D' },
  { id: 'edit', icon: Edit3, label: 'Chỉnh sửa đỉnh', shortcut: 'E' },
  { id: 'move', icon: Move, label: 'Di chuyển tuyến', shortcut: 'M' },
  { id: 'delete', icon: Trash2, label: 'Xóa tuyến', shortcut: 'Del' },
];

interface MapToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function MapToolbar({
  onUndo,
  onRedo,
  onSave,
  canUndo = false,
  canRedo = false,
}: MapToolbarProps) {
  const { activeTool, setActiveTool } = useMapStore();

  return (
    <div className="map-toolbar animate-fade-in">
      {/* Drawing Tools */}
      {tools.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
              className={cn(
                'map-toolbar-button',
                activeTool === tool.id && 'active'
              )}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            <span>{tool.label}</span>
            {tool.shortcut && (
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">{tool.shortcut}</kbd>
            )}
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="map-toolbar-divider" />

      {/* Undo/Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn('map-toolbar-button', !canUndo && 'opacity-40 cursor-not-allowed')}
          >
            <Undo2 className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Hoàn tác</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+Z</kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn('map-toolbar-button', !canRedo && 'opacity-40 cursor-not-allowed')}
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Làm lại</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+Y</kbd>
        </TooltipContent>
      </Tooltip>

      <div className="map-toolbar-divider" />

      {/* Layer Selector */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className="map-toolbar-button">
                <Layers className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Chọn lớp bản đồ</TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuItem>Bản đồ thường</DropdownMenuItem>
          <DropdownMenuItem>Vệ tinh</DropdownMenuItem>
          <DropdownMenuItem>Giao thông</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="map-toolbar-divider" />

      {/* Save */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            onClick={onSave}
            className="gradient-primary text-primary-foreground h-9 px-4"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Lưu
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Lưu thay đổi</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+S</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
