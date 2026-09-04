import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, of, finalize, firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Coordinates } from '../models/trip.model';

export interface PlaceResult {
  name: string;
  address: string;
  coordinates: Coordinates;
  type: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    country?: string;
    type?: string;
    osm_value?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PhotonService {
  private readonly http = inject(HttpClient);
  private readonly HOST = 'https://photon.komoot.io';

  /**
   * Autocompletado de lugares. Recibe el stream de textos y devuelve un stream
   * de resultados. `onDone` se invoca cada vez que termina una búsqueda (éxito,
   * vacío o error) para que el llamante apague su indicador de "buscando".
   */
  search(
    query$: Observable<string>,
    bias?: Signal<Coordinates | undefined>,
    onDone?: () => void,
  ): Observable<PlaceResult[]> {
    return query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) {
          onDone?.();
          return of([] as PlaceResult[]);
        }
        // Nota: no se envía 'lang'; la instancia pública de Photon solo admite
        // un conjunto limitado de idiomas y un valor no soportado (p.ej. 'es')
        // devuelve 400. Se usa el idioma del navegador (accept-language).
        let params = new HttpParams().set('q', q).set('limit', '6');
        const coords = bias?.();
        // Solo aplicar bias si las coordenadas son reales (no 0,0 por defecto)
        if (coords && (coords.lat !== 0 || coords.lng !== 0)) {
          params = params
            .set('lat', String(coords.lat))
            .set('lon', String(coords.lng));
        }
        return this.http.get<{ features: PhotonFeature[] }>(`${this.HOST}/api`, { params }).pipe(
          map(res => res.features.map(f => this.toPlaceResult(f))),
          catchError(() => of([] as PlaceResult[])),
          finalize(() => onDone?.()),
        );
      }),
    );
  }

  /**
   * Reverse geocoding: dadas unas coordenadas, devuelve el lugar más cercano.
   * Se usa al hacer click en el mapa para añadir una parada.
   */
  async reverse(coords: Coordinates): Promise<PlaceResult> {
    // El endpoint reverse cuelga de la raíz del host (/reverse), no de /api.
    // Sin 'lang' (la instancia pública no admite 'es' y devolvería 400).
    const params = new HttpParams()
      .set('lat', String(coords.lat))
      .set('lon', String(coords.lng));
    try {
      const res = await firstValueFrom(
        this.http.get<{ features: PhotonFeature[] }>(`${this.HOST}/reverse`, { params })
      );
      const f = res.features?.[0];
      if (f) {
        const place = this.toPlaceResult(f);
        // Conservar las coordenadas exactas del click, no las del resultado
        return { ...place, coordinates: coords };
      }
    } catch {
      /* fallthrough al fallback */
    }
    return {
      name: 'Ubicación seleccionada',
      address: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      coordinates: coords,
      type: 'place',
    };
  }

  private toPlaceResult(f: PhotonFeature): PlaceResult {
    const p = f.properties;
    const streetLine = [p.street, p.housenumber].filter(Boolean).join(' ');
    const address = [streetLine, p.city, p.country].filter(Boolean).join(', ');
    // El nombre puede faltar (p.ej. una calle o un punto sin POI): componer uno útil
    const name = p.name || streetLine || p.city || p.country || 'Ubicación';
    return {
      name,
      address: address || name,
      coordinates: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
      type: p.osm_value ?? p.type ?? 'place',
    };
  }
}
