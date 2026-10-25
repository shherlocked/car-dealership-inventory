/** A user's public-facing profile, mirroring the backend's public user shape. */
export interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
}

/** A vehicle record as returned by the inventory API. */
export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

/** Optional search filters accepted by the vehicles search endpoint. */
export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}
