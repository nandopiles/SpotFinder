import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NgZone } from '@angular/core';
import { Trip, CreateTripDto, UpdateTripDto, ReorderSpotsDto } from '../models/trip.model';

type LoadingState = 'idle' | 'loading' | 'error';

@Injectable({ providedIn: 'root' })
export class TripStore {
  private readonly http   = inject(HttpClient);
  private readonly zone   = inject(NgZone);
  private readonly BASE   = '/api/trips';

  readonly trips         = signal<Trip[]>([]);
  readonly selectedTripId = signal<string | null>(null);
  readonly loadingState  = signal<LoadingState>('idle');
  readonly error         = signal<string | null>(null);

  readonly selectedTrip = computed(() =>
    this.trips().find(t => t.id === this.selectedTripId()) ?? null
  );

  readonly orderedSpots = computed(() =>
    [...(this.selectedTrip()?.spots ?? [])].sort((a, b) => a.order - b.order)
  );

  readonly isLoading = computed(() => this.loadingState() === 'loading');

  // Ejecuta el callback dentro de NgZone para que OnPush detecte los cambios
  private run<T>(fn: () => T): T {
    return this.zone.run(fn);
  }

  async loadTrips(): Promise<void> {
    this.run(() => {
      this.loadingState.set('loading');
      this.error.set(null);
    });
    try {
      const trips = await firstValueFrom(this.http.get<Trip[]>(this.BASE));
      this.run(() => {
        this.trips.set(trips);
        this.loadingState.set('idle');
      });
    } catch {
      this.run(() => {
        this.error.set('Error al cargar los viajes');
        this.loadingState.set('error');
      });
    }
  }

  async loadTrip(id: string): Promise<void> {
    this.run(() => {
      this.loadingState.set('loading');
      this.error.set(null);
    });
    try {
      const trip = await firstValueFrom(this.http.get<Trip>(`${this.BASE}/${id}`));
      this.run(() => {
        this.trips.update(ts => {
          const idx = ts.findIndex(t => t.id === id);
          return idx === -1 ? [...ts, trip] : ts.with(idx, trip);
        });
        this.selectedTripId.set(id);
        this.loadingState.set('idle');
      });
    } catch {
      this.run(() => {
        this.error.set('Error al cargar el viaje');
        this.loadingState.set('error');
      });
    }
  }

  async createTrip(dto: CreateTripDto): Promise<Trip> {
    const trip = await firstValueFrom(this.http.post<Trip>(this.BASE, dto));
    this.run(() => this.trips.update(ts => [...ts, trip]));
    return trip;
  }

  async updateTrip(id: string, dto: UpdateTripDto): Promise<void> {
    const updated = await firstValueFrom(
      this.http.patch<Trip>(`${this.BASE}/${id}`, dto)
    );
    this.run(() =>
      this.trips.update(ts => ts.map(t => (t.id === id ? updated : t)))
    );
  }

  async deleteTrip(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.BASE}/${id}`));
    this.run(() => {
      this.trips.update(ts => ts.filter(t => t.id !== id));
      if (this.selectedTripId() === id) this.selectedTripId.set(null);
    });
  }

  async reorderSpots(tripId: string, dto: ReorderSpotsDto): Promise<void> {
    const snapshot = this.trips();
    this.run(() =>
      this.trips.update(ts =>
        ts.map(t => {
          if (t.id !== tripId) return t;
          const orderMap = new Map(dto.map(r => [r.spotId, r.order]));
          return {
            ...t,
            spots: t.spots
              .map(s => ({ ...s, order: orderMap.get(s.id) ?? s.order }))
              .sort((a, b) => a.order - b.order),
          };
        })
      )
    );
    try {
      await firstValueFrom(
        this.http.patch<Trip>(`${this.BASE}/${tripId}/spots/reorder`, dto)
      );
    } catch {
      this.run(() => this.trips.set(snapshot));
    }
  }

  selectTrip(id: string): void {
    this.selectedTripId.set(id);
  }
}
