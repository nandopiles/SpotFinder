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
  endTime: string;     // "HH:mm"
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
  icon: string;
  color: string;
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
export type CreateSpotDto = Omit<ActivitySpot, 'id' | 'order'>;
export type UpdateSpotDto = Partial<Omit<ActivitySpot, 'id' | 'order'>>;

export const CATEGORY_META: Record<ActivityCategory, { label: string; color: string; emoji: string }> = {
  food:     { label: 'Gastronomía', color: 'bg-orange-100 text-orange-700', emoji: '🍽️' },
  culture:  { label: 'Cultura',     color: 'bg-purple-100 text-purple-700', emoji: '🏛️' },
  nature:   { label: 'Naturaleza',  color: 'bg-green-100 text-green-700',   emoji: '🌿' },
  leisure:  { label: 'Ocio',        color: 'bg-blue-100 text-blue-700',     emoji: '🎭' },
  shopping: { label: 'Compras',     color: 'bg-pink-100 text-pink-700',     emoji: '🛍️' },
};

// ── Helpers de tiempo (una única fuente de verdad) ─────────────────────────

/** "HH:mm" -> minutos desde medianoche. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Minutos desde medianoche -> "HH:mm" (envuelve a 24h). */
export function toHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = ((min % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Duración de una parada en minutos, derivada de startTime/endTime.
 * Si endTime es anterior o igual a startTime devuelve 0.
 */
export function spotDuration(spot: { startTime: string; endTime: string }): number {
  return Math.max(0, toMinutes(spot.endTime) - toMinutes(spot.startTime));
}

/** Formatea una duración en minutos: "1h 30m" / "45 min". */
export function formatDuration(min: number): string {
  if (min <= 0) return '—';
  return min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min} min`;
}
