export interface Coordinates {
  lat: number;
  lng: number;
}

export type TransportMode = 'walking' | 'cycling' | 'driving' | 'transit';
export type ActivityCategory = 'food' | 'culture' | 'nature' | 'leisure' | 'shopping';
export type TripStatus = 'draft' | 'planned' | 'completed';

export interface ActivitySpot {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  coordinates: Coordinates;
  address: string;
  startTime: string;   // "HH:mm"
  duration: number;    // minutes
  order: number;
  imageUrl?: string;
  notes?: string;
}

export interface Leg {
  fromSpotId: string;
  toSpotId: string;
  mode: TransportMode;
  estimatedMinutes: number;
}

export interface Trip {
  id: string;
  title: string;
  date: string;
  city: string;
  centerCoordinates: Coordinates;
  status: TripStatus;
  spots: ActivitySpot[];
  legs: Leg[];
  createdAt: string;
  updatedAt: string;
}

export type CreateTripDto = Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTripDto = Partial<CreateTripDto>;
export type ReorderSpotsDto = { spotId: string; order: number }[];

export const CATEGORY_META: Record<ActivityCategory, { label: string; color: string; emoji: string }> = {
  food:     { label: 'Gastronomía', color: 'bg-orange-100 text-orange-700', emoji: '🍽️' },
  culture:  { label: 'Cultura',     color: 'bg-purple-100 text-purple-700', emoji: '🏛️' },
  nature:   { label: 'Naturaleza',  color: 'bg-green-100 text-green-700',   emoji: '🌿' },
  leisure:  { label: 'Ocio',        color: 'bg-blue-100 text-blue-700',     emoji: '🎭' },
  shopping: { label: 'Compras',     color: 'bg-pink-100 text-pink-700',     emoji: '🛍️' },
};
