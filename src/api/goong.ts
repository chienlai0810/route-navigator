import axios from 'axios';

// Goong API key - should be stored in environment variables
const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || 'YOUR_GOONG_API_KEY';
const GOONG_BASE_URL = 'https://rsapi.goong.io';

export interface GoongPrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GoongAutoCompleteResponse {
  predictions: GoongPrediction[];
  status: string;
}

export interface GoongPlaceDetail {
  result: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
    name: string;
  };
  status: string;
}

export interface GoongGeocodeResult {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  status: string;
}

export const goongApi = {
  // Autocomplete địa chỉ
  autocomplete: async (input: string): Promise<GoongPrediction[]> => {
    try {
      const response = await axios.get<GoongAutoCompleteResponse>(
        `${GOONG_BASE_URL}/Place/AutoComplete`,
        {
          params: {
            api_key: GOONG_API_KEY,
            input,
            limit: 5,
          },
        }
      );

      if (response.data.status === 'OK') {
        return response.data.predictions;
      }
      return [];
    } catch (error) {
      console.error('Goong autocomplete error:', error);
      return [];
    }
  },

  // Lấy chi tiết địa điểm (bao gồm lat/lng)
  placeDetail: async (placeId: string): Promise<{ lat: number; lng: number; address: string } | null> => {
    try {
      const response = await axios.get<GoongPlaceDetail>(
        `${GOONG_BASE_URL}/Place/Detail`,
        {
          params: {
            api_key: GOONG_API_KEY,
            place_id: placeId,
          },
        }
      );

      if (response.data.status === 'OK' && response.data.result) {
        return {
          lat: response.data.result.geometry.location.lat,
          lng: response.data.result.geometry.location.lng,
          address: response.data.result.formatted_address || response.data.result.name,
        };
      }
      return null;
    } catch (error) {
      console.error('Goong place detail error:', error);
      return null;
    }
  },

  // Geocode: convert địa chỉ thành lat/lng
  geocode: async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await axios.get<GoongGeocodeResult>(
        `${GOONG_BASE_URL}/Geocode`,
        {
          params: {
            api_key: GOONG_API_KEY,
            address,
          },
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('Goong geocode error:', error);
      return null;
    }
  },
};
