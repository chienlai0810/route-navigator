import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MapPin, Search, X, MapPinned, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routesApi } from '@/api/routes';
import { goongApi, GoongPrediction } from '@/api/goong';
import { useMapStore } from '@/hooks/useMapStore';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { productTypeOptions } from '@/constants';
import { ProductType } from '@/types';

export function CheckPointInput() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [productType, setProductType] = useState<ProductType | 'ALL'>('ALL');
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<GoongPrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const { 
    setHighlightedRouteIds, 
    setCheckPointLocation, 
    mapInstance,
    highlightedRouteIds,
    checkPointLocation,
  } = useMapStore();

  const debouncedAddress = useDebounce(addressInput, 500);

  // Fetch suggestions when address input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedAddress || debouncedAddress.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      const results = await goongApi.autocomplete(debouncedAddress);
      setSuggestions(results);
      setIsLoadingSuggestions(false);
      setShowSuggestions(true);
    };

    fetchSuggestions();
  }, [debouncedAddress]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkPointMutation = useMutation({
    mutationFn: ({ latitude, longitude, productType }: { latitude: number; longitude: number; productType?: string }) =>
      routesApi.checkPointInPolygon({ latitude, longitude, productType }),
    onSuccess: (data) => {
      const routeIds = data.matchingRoutes.map(r => r.id);
      setHighlightedRouteIds(routeIds);
      setCheckPointLocation({ lat: data.latitude, lng: data.longitude });

      // Zoom to the point on map
      if (mapInstance) {
        mapInstance.setView([data.latitude, data.longitude], 15, {
          animate: true,
          duration: 0.5,
        });
      }

      if (data.found && data.matchingRoutes.length > 0) {
        const routeNames = data.matchingRoutes.map(r => r.name).join(', ');
        toast.success(`Tìm thấy ${data.matchingRoutes.length} tuyến: ${routeNames}`);
      } else {
        toast.info('Điểm không thuộc tuyến nào');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Kiểm tra điểm thất bại');
    },
  });

  const handleCheck = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Vui lòng nhập tọa độ hợp lệ');
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error('Latitude phải từ -90 đến 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error('Longitude phải từ -180 đến 180');
      return;
    }

    checkPointMutation.mutate({ 
      latitude: lat, 
      longitude: lng,
      productType: productType !== 'ALL' ? productType : undefined
    });
  };

  const handleClear = () => {
    setLatitude('');
    setLongitude('');
    setProductType('ALL');
    setAddressInput('');
    setSuggestions([]);
    setHighlightedRouteIds([]);
    setCheckPointLocation(null);
  };

  const handleSelectAddress = async (prediction: GoongPrediction) => {
    setAddressInput(prediction.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsGeocodingAddress(true);

    try {
      const location = await goongApi.placeDetail(prediction.place_id);
      
      if (location) {
        setLatitude(location.lat.toString());
        setLongitude(location.lng.toString());
        
        // Auto check the point
        checkPointMutation.mutate({ 
          latitude: location.lat, 
          longitude: location.lng,
          productType: productType !== 'ALL' ? productType : undefined
        });
      } else {
        toast.error('Không thể lấy tọa độ từ địa chỉ này');
      }
    } catch (error) {
      toast.error('Lỗi khi lấy tọa độ');
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const hasActiveCheck = highlightedRouteIds.length > 0 || checkPointLocation !== null;

  return (
    <div className={cn(
      'p-3 pt-8 mb-3 rounded-lg border transition-colors',
      hasActiveCheck ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-base font-medium">Kiểm tra điểm</span>
        {hasActiveCheck && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="ml-auto h-6 px-2"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Address Search */}
        <div className="relative" ref={suggestionRef}>
          <div className="relative">
            <MapPinned className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm địa chỉ..."
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                setShowSuggestions(true);
              }}
              className="h-8 text-xs pl-7"
              disabled={isGeocodingAddress}
            />
            {(isLoadingSuggestions || isGeocodingAddress) && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handleSelectAddress(prediction)}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-xs border-b border-border last:border-b-0"
                >
                  <div className="font-medium text-foreground">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-muted-foreground text-[10px] mt-0.5">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Lat/Long Inputs */}
        <div className="flex gap-2">
          <Input
            type="number"
            step="any"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="h-8 text-xs"
            onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
          />
          <Input
            type="number"
            step="any"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="h-8 text-xs"
            onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
          />
        </div>

        {/* Product Type Select */}
        <div>
          <Select value={productType} onValueChange={(value) => setProductType(value as ProductType | 'ALL')}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Loại hàng hóa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại hàng</SelectItem>
              {productTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={handleCheck}
          disabled={!latitude || !longitude || checkPointMutation.isPending}
          size="sm"
          className="w-full h-8 text-xs"
        >
          {checkPointMutation.isPending ? (
            <>Đang kiểm tra...</>
          ) : (
            <>
              <Search className="w-3 h-3 mr-1" />
              Kiểm tra
            </>
          )}
        </Button>
      </div>

      {hasActiveCheck && highlightedRouteIds.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Tìm thấy <span className="font-semibold text-primary">{highlightedRouteIds.length}</span> tuyến
          </p>
        </div>
      )}
    </div>
  );
}
