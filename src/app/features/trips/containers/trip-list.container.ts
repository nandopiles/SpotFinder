import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TripStore } from '../../../core/services/trip.store';
import { TripCardComponent } from '../components/trip-card.component';
import { CreateTripModalComponent } from '../components/create-trip-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { CreateTripDto } from '../../../core/models/trip.model';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [TripCardComponent, CreateTripModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen">

      <!-- Hero / Page header -->
      <div class="relative overflow-hidden bg-white border-b border-surface-border">
        <!-- Background decoration -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-accent-50/40 pointer-events-none"></div>
        <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary-100/40 to-transparent
                    rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div class="animate-fade-up">
              <p class="section-title text-primary-500 mb-2">Planificador de viajes</p>
              <h1 class="text-3xl font-bold text-ink tracking-tight">Mis viajes</h1>
              <p class="text-sm text-ink-muted mt-1.5">
                Organiza tus itinerarios express y explora el mundo
              </p>
            </div>

            <!-- Stats + CTA -->
            <div class="flex items-center gap-3 animate-fade-up" style="animation-delay: 0.05s">
              @if (store.trips().length) {
                <div class="hidden sm:flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-surface-subtle border border-surface-border">
                  <div class="text-center">
                    <p class="text-lg font-bold text-ink leading-none">{{ store.trips().length }}</p>
                    <p class="text-2xs text-ink-muted mt-0.5">viajes</p>
                  </div>
                  <div class="w-px h-8 bg-surface-border"></div>
                  <div class="text-center">
                    <p class="text-lg font-bold text-ink leading-none">{{ totalSpots() }}</p>
                    <p class="text-2xs text-ink-muted mt-0.5">paradas</p>
                  </div>
                </div>
              }
              <button class="btn-primary" (click)="showModal.set(true)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                </svg>
                Nuevo viaje
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Error banner -->
        @if (store.error()) {
          <div class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 animate-fade-up">
            <div class="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-red-800">{{ store.error() }}</p>
            </div>
            <button class="btn-ghost text-red-600 hover:bg-red-100 text-xs" (click)="store.loadTrips()">
              Reintentar
            </button>
          </div>
        }

        <!-- Loading skeletons -->
        @if (store.isLoading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (_ of skeletons; track $index) {
              <div class="card overflow-hidden animate-fade-in" [style.animation-delay]="$index * 50 + 'ms'">
                <div class="skeleton h-28"></div>
                <div class="p-4 space-y-3">
                  <div class="skeleton h-4 w-3/4 rounded-lg"></div>
                  <div class="skeleton h-3 w-1/2 rounded-lg"></div>
                  <div class="skeleton h-3 w-full rounded-lg mt-4"></div>
                </div>
              </div>
            }
          </div>

        <!-- Empty state -->
        } @else if (!store.trips().length) {
          <app-empty-state
            emoji="✈️"
            title="Aún no tienes viajes"
            description="Crea tu primer itinerario express y empieza a explorar el mundo parada a parada"
            actionLabel="Crear mi primer viaje"
            (action)="showModal.set(true)"
          />

        <!-- Grid -->
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (trip of store.trips(); track trip.id) {
              <div class="animate-fade-up" [style.animation-delay]="$index * 40 + 'ms'">
                <app-trip-card
                  [trip]="trip"
                  (select)="onSelect($event)"
                  (delete)="onDelete($event)"
                />
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <app-create-trip-modal
        (confirm)="onCreate($event)"
        (cancel)="showModal.set(false)"
      />
    }
  `,
})
export class TripListContainer implements OnInit {
  protected readonly store = inject(TripStore);
  private readonly router = inject(Router);

  readonly showModal = signal(false);
  readonly skeletons = Array(6);

  readonly totalSpots = computed(() =>
    this.store.trips().reduce((acc, t) => acc + t.spots.length, 0)
  );

  ngOnInit(): void {
    this.store.loadTrips();
  }

  onSelect(id: string): void {
    this.router.navigate(['/trips', id]);
  }

  async onDelete(id: string): Promise<void> {
    if (!confirm('¿Eliminar este viaje? Esta acción no se puede deshacer.')) return;
    await this.store.deleteTrip(id);
  }

  async onCreate(dto: CreateTripDto): Promise<void> {
    const trip = await this.store.createTrip(dto);
    this.showModal.set(false);
    this.router.navigate(['/trips', trip.id]);
  }
}
