import { Injectable, signal } from '@angular/core';
import { Trip, UpdateTripDto, CreateSpotDto, Coordinates } from '../models/trip.model';

export type PanelState = 'closed' | 'open' | 'closing';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly editPanelState  = signal<PanelState>('closed');
  readonly editPanelTrip   = signal<Trip | null>(null);
  readonly editPanelSave   = signal<((dto: UpdateTripDto) => void) | null>(null);
  readonly editPanelSaving = signal(false);

  readonly addSpotOpen     = signal(false);
  readonly addSpotBias     = signal<Coordinates | undefined>(undefined);
  readonly addSpotConfirm  = signal<((dto: CreateSpotDto) => void) | null>(null);
}
