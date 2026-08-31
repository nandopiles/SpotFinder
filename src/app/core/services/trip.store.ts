import { Injectable, computed, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Trip, CreateTripDto, UpdateTripDto, ReorderSpotsDto, ActivitySpot, CreateSpotDto } from '../models/trip.model';

type LoadingState = 'idle' | 'loading' | 'error';

interface StoreState {
  trips: Trip[];
  loadingState: LoadingState;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class TripStore {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/trips';

  private readonly state = signal<StoreState>({
    trips: [],
    loadingState: 'idle',
    error: null,
  });

  readonly trips        = computed(() => this.state().trips);
  readonly loadingState = computed(() => this.state().loadingState);
  readonly error        = computed(() => this.state().error);
  readonly isLoading    = computed(() => this.state().loadingState === 'loading');

  readonly selectedTripId = signal<string | null>(null);

  readonly selectedTrip = computed(() =>
    this.trips().find(t => t.id === this.selectedTripId()) ?? null
  );

  readonly orderedSpots = computed(() =>
    [...(this.selectedTrip()?.spots ?? [])].sort((a, b) => a.order - b.order)
  );

  async loadTrips(): Promise<void> {
    this.state.update(s => ({ ...s, loadingState: 'loading', error: null }));
    try {
      const trips = await firstValueFrom(this.http.get<Trip[]>(this.BASE));
      this.state.set({ trips, loadingState: 'idle', error: null });
    } catch {
      this.state.update(s => ({ ...s, loadingState: 'error', error: 'Error al cargar los viajes' }));
    }
  }

  async loadTrip(id: string): Promise<void> {
    this.state.update(s => ({ ...s, loadingState: 'loading', error: null }));
    try {
      const trip = await firstValueFrom(this.http.get<Trip>(`${this.BASE}/${id}`));
      this.state.update(s => {
        const idx = s.trips.findIndex(t => t.id === id);
        const trips = idx === -1 ? [...s.trips, trip] : s.trips.with(idx, trip);
        return { trips, loadingState: 'idle', error: null };
      });
      this.selectedTripId.set(id);
    } catch {
      this.state.update(s => ({ ...s, loadingState: 'error', error: 'Error al cargar el viaje' }));
    }
  }

  async createTrip(dto: CreateTripDto): Promise<Trip> {
    const trip = await firstValueFrom(this.http.post<Trip>(this.BASE, dto));
    this.state.update(s => ({ ...s, trips: [...s.trips, trip] }));
    return trip;
  }

  async updateTrip(id: string, dto: UpdateTripDto): Promise<void> {
    const updated = await firstValueFrom(this.http.patch<Trip>(`${this.BASE}/${id}`, dto));
    this.state.update(s => ({
      ...s,
      trips: s.trips.map(t => (t.id === id ? updated : t)),
    }));
  }

  async deleteTrip(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.BASE}/${id}`));
    this.state.update(s => ({ ...s, trips: s.trips.filter(t => t.id !== id) }));
    if (untracked(this.selectedTripId) === id) this.selectedTripId.set(null);
  }

  async addSpot(tripId: string, dto: CreateSpotDto): Promise<void> {
    const spot = await firstValueFrom(
      this.http.post<ActivitySpot>(`${this.BASE}/${tripId}/spots`, dto)
    );
    this.state.update(s => ({
      ...s,
      trips: s.trips.map(t => t.id === tripId ? { ...t, spots: [...t.spots, spot] } : t),
    }));
  }

  async reorderSpots(tripId: string, dto: ReorderSpotsDto): Promise<void> {
    const snapshot = untracked(this.state);
    this.state.update(s => ({
      ...s,
      trips: s.trips.map(t => {
        if (t.id !== tripId) return t;
        const orderMap = new Map(dto.map(r => [r.spotId, r.order]));
        return {
          ...t,
          spots: t.spots
            .map(sp => ({ ...sp, order: orderMap.get(sp.id) ?? sp.order }))
            .sort((a, b) => a.order - b.order),
        };
      }),
    }));
    try {
      await firstValueFrom(this.http.patch<Trip>(`${this.BASE}/${tripId}/spots/reorder`, dto));
    } catch {
      this.state.set(snapshot);
    }
  }

  selectTrip(id: string): void {
    this.selectedTripId.set(id);
  }
}
