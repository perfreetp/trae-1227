export interface LoadingRecord {
  id: string;
  taskId: string;
  taskNo: string;
  bundleCount: number;
  bundlePhotos: string[];
  weight: number;
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  loadingPerson: string;
  loadingTime: string;
  remarks?: string;
}

export interface RouteInfo {
  id: string;
  taskId: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  heightLimitPoints: HeightLimitPoint[];
  widthLimitPoints: WidthLimitPoint[];
  roadConditions: RoadCondition[];
}

export interface HeightLimitPoint {
  name: string;
  height: number;
  position: string;
}

export interface WidthLimitPoint {
  name: string;
  width: number;
  position: string;
}

export interface RoadCondition {
  type: 'normal' | 'congestion' | 'construction' | 'accident';
  description: string;
  position: string;
}
