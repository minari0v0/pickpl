import { create } from 'zustand';

export type FallbackPlaceType = 'seongsu' | 'gangnam';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'error';
  fallbackPlace: FallbackPlaceType;
  setLocation: (lat: number, lon: number) => void;
  setFallbackPlace: (place: FallbackPlaceType) => void;
  setPermissionStatus: (status: 'granted' | 'denied' | 'prompt' | 'error') => void;
  useFallbackCoordinates: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  permissionStatus: 'prompt',
  fallbackPlace: 'seongsu',
  setLocation: (lat, lon) => set({ latitude: lat, longitude: lon }),
  setFallbackPlace: (place) => {
    set({ fallbackPlace: place });
    const status = get().permissionStatus;
    if (status === 'denied' || status === 'error' || status === 'prompt') {
      get().useFallbackCoordinates();
    }
  },
  setPermissionStatus: (status) => set({ permissionStatus: status }),
  useFallbackCoordinates: () => {
    const place = get().fallbackPlace;
    if (place === 'seongsu') {
      set({ latitude: 37.5446, longitude: 127.0560 }); // 성수역 2호선 좌표
    } else if (place === 'gangnam') {
      set({ latitude: 37.4979, longitude: 127.0276 }); // 강남역 좌표
    }
  },
}));
