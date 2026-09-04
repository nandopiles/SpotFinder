import { Injectable, signal } from '@angular/core';
import { Trip, UpdateTripDto, CreateSpotDto, UpdateSpotDto, ActivitySpot, Coordinates } from '../models/trip.model';
import { PlaceResult } from './photon.service';

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
  readonly addSpotPlace    = signal<PlaceResult | null>(null);

  // Panel de edición de parada
  readonly editSpotState   = signal<PanelState>('closed');
  readonly editSpotSpot    = signal<ActivitySpot | null>(null);
  readonly editSpotSave    = signal<((dto: UpdateSpotDto) => void) | null>(null);
  readonly editSpotSaving  = signal(false);

  // Confirmación de borrado de parada — se monta en app.component (fuera del shell) para desenfocarlo
  readonly confirmSpotDeleteOpen = signal(false);
  readonly confirmSpotDeleteName = signal('');
  readonly confirmSpotDelete     = signal<(() => void) | null>(null);
}
