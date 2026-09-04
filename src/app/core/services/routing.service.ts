import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Coordinates, TransportMode } from '../models/trip.model';

export interface ModeOption {
  mode: TransportMode;
  /** Duración estimada en segundos para este modo */
  duration: number;
}

export interface LegOptions {
  /** Distancia real del tramo (m) — común a todos los modos */
  distance: number;
  /** Geometría de la ruta (calles) para dibujar */
  geometry: [number, number][];
  /** Duración estimada por cada modo */
  options: ModeOption[];
  /** Modo recomendado según la distancia */
  recommended: TransportMode;
  /** Motivo breve de la recomendación */
  reason: string;
}

interface OsrmResponse {
  code: string;
  routes: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

// Velocidades aproximadas (km/h) para reestimar la duración según el modo,
// ya que la instancia pública de OSRM solo expone el perfil 'driving'.
const SPEED_KMH: Record<TransportMode, number> = {
  walking: 4.8,
  cycling: 15,
  transit: 25,
  driving: 40, // urbano
};

@Injectable({ providedIn: 'root' })
export class RoutingService {
  private readonly http = inject(HttpClient);
  private readonly BASE = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * Calcula un tramo con las 4 modalidades de transporte, la recomendada y su motivo.
   * Hace una sola petición a OSRM para la distancia/geometría reales.
   */
  async legOptions(from: Coordinates, to: Coordinates): Promise<LegOptions> {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${this.BASE}/${coords}?overview=full&geometries=geojson`;

    let distance: number;
    let geometry: [number, number][];
    try {
      const res = await firstValueFrom(this.http.get<OsrmResponse>(url));
      if (res.code === 'Ok' && res.routes.length) {
        distance = res.routes[0].distance;
        geometry = res.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      } else {
        distance = this.haversine(from, to);
        geometry = [[from.lat, from.lng], [to.lat, to.lng]];
      }
    } catch {
      distance = this.haversine(from, to);
      geometry = [[from.lat, from.lng], [to.lat, to.lng]];
    }

    const modes: TransportMode[] = ['walking', 'cycling', 'transit', 'driving'];
    const options: ModeOption[] = modes.map(mode => ({
      mode,
      duration: this.durationFor(distance, mode),
    }));

    const { recommended, reason } = this.recommend(distance);
    return { distance, geometry, options, recommended, reason };
  }

  private recommend(distanceMeters: number): { recommended: TransportMode; reason: string } {
    const km = distanceMeters / 1000;
    if (km < 1)  return { recommended: 'walking', reason: 'Muy cerca, se llega antes andando' };
    if (km < 3)  return { recommended: 'cycling', reason: 'Distancia ideal para ir en bici' };
    if (km < 8)  return { recommended: 'transit', reason: 'Trayecto medio, mejor en transporte público' };
    return { recommended: 'driving', reason: 'Está lejos, en coche se tarda menos' };
  }

  private durationFor(distanceMeters: number, mode: TransportMode): number {
    const speed = SPEED_KMH[mode];
    return (distanceMeters / 1000 / speed) * 3600;
  }

  private haversine(a: Coordinates, b: Coordinates): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
}
