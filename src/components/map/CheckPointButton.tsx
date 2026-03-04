import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckPointResponse } from '@/api/routes';
import { routeTypeLabels } from '@/constants';

interface CheckPointButtonProps {
  isActive: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export function CheckPointButton({ isActive, onToggle, isLoading }: CheckPointButtonProps) {
  return (
    <Button
      onClick={onToggle}
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      className={cn(
        'gap-2',
        isActive && 'bg-primary text-primary-foreground'
      )}
      disabled={isLoading}
    >
      <MapPin className="w-4 h-4" />
      {isActive ? 'Tắt kiểm tra điểm' : 'Kiểm tra điểm'}
    </Button>
  );
}

interface CheckPointResultProps {
  result: CheckPointResponse;
  onClose: () => void;
}

export function CheckPointResult({ result, onClose }: CheckPointResultProps) {
  if (!result) return null;

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-border max-w-md">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">Kết quả kiểm tra điểm</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tọa độ: {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-1"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {result.found && result.matchingRoutes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              ✓ Điểm nằm trong {result.matchingRoutes.length} tuyến:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {result.matchingRoutes.map((route) => (
                <div
                  key={route.id}
                  className="p-3 bg-muted/50 rounded-md text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{route.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mã: {route.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {route.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: route.color }}
                        />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {routeTypeLabels[route.type as keyof typeof routeTypeLabels]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            ✗ Điểm không nằm trong tuyến nào
          </p>
        )}
      </div>
    </div>
  );
}
