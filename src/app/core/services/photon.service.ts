import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, of } from 'rxjs';
import { Observable, Subject } from 'rxjs';
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
  private readonly BASE = 'https://photon.komoot.io/api';

  search(query$: Observable<string>, bias?: Signal<Coordinates | undefined>): Observable<PlaceResult[]> {
    return query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) return of([]);
        let params = new HttpParams().set('q', q).set('limit', '6');
        const coords = bias?.();
        if (coords) {
          const delta = 0.5;
          params = params
            .set('bbox', `${coords.lng - delta},${coords.lat - delta},${coords.lng + delta},${coords.lat + delta}`);
        }
        return this.http.get<{ features: PhotonFeature[] }>(this.BASE, { params }).pipe(
          map(res => res.features.map(f => this.toPlaceResult(f))),
          catchError(() => of([])),
        );
      }),
    );
  }

  private toPlaceResult(f: PhotonFeature): PlaceResult {
    const p = f.properties;
    const parts = [p.street, p.housenumber].filter(Boolean).join(' ');
    const city = p.city ?? '';
    const address = [parts, city, p.country].filter(Boolean).join(', ');
    return {
      name: p.name ?? address,
      address,
      coordinates: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
      type: p.osm_value ?? p.type ?? 'place',
    };
  }
}
