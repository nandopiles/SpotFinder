import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TripStore } from '../../../core/services/trip.store';
import { TripCardComponent } from '../components/trip-card.component';
import { CreateTripModalComponent } from '../components/create-trip-modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal.component';
import { CreateTripDto } from '../../../core/models/trip.model';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [TripCardComponent, CreateTripModalComponent, EmptyStateComponent, ConfirmModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col">

      <!-- ── Hero ─────────────────────────────────────────────────────────── -->
      <section class="relative overflow-hidden bg-white border-b border-surface-border">

        <!-- Fondo decorativo -->
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,_#e0e7ff_0%,_transparent_70%)]"></div>
          <div class="absolute inset-0 opacity-[0.025]"
               style="background-image: linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px); background-size: 40px 40px;"></div>
        </div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-8">

            <!-- Copy -->
            <div class="max-w-xl">
              <!-- Eyebrow -->
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-primary-50 border border-primary-100 mb-5">
                <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                <span class="text-xs font-semibold text-primary-600 tracking-wide">Planificador de viajes express</span>
              </div>

              <h1 class="text-4xl sm:text-5xl font-bold text-ink tracking-tight leading-[1.1]">
                Tus aventuras,<br>
                <span style="color: #4f46e5">organizadas</span>
              </h1>

              <p class="mt-4 text-base text-ink-muted leading-relaxed max-w-md">
                Crea itinerarios de un día, arrastra las paradas para reordenarlas
                y visualízalas en el mapa en tiempo real.
              </p>

              <!-- CTA -->
              <div class="mt-7 flex items-center gap-3">
                <button class="btn-primary-lg" (click)="showModal.set(true)">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                  Nuevo viaje
                </button>
                @if (store.trips().length) {
                  <a class="btn-ghost" (click)="scrollToTrips()">
                    Ver mis viajes
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </a>
                }
              </div>
            </div>

            <!-- Stats cards -->
            @if (!store.isLoading() && store.trips().length) {
              <div class="flex gap-3 lg:flex-col">
                <div class="card px-5 py-4 flex items-center gap-4 min-w-[140px]">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700
                              flex items-center justify-center shadow-sm shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-ink leading-none">{{ store.trips().length }}</p>
                    <p class="text-xs text-ink-muted mt-0.5">viaje{{ store.trips().length !== 1 ? 's' : '' }}</p>
                  </div>
                </div>

                <div class="card px-5 py-4 flex items-center gap-4 min-w-[140px]">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700
                              flex items-center justify-center shadow-sm shrink-0">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-ink leading-none">{{ totalSpots() }}</p>
                    <p class="text-xs text-ink-muted mt-0.5">parada{{ totalSpots() !== 1 ? 's' : '' }}</p>
                  </div>
                </div>
              </div>
            }

          </div>
        </div>
      </section>

      <!-- ── Content ───────────────────────────────────────────────────────── -->
      <div id="trips-grid" class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Error -->
        @if (store.error()) {
          <div class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div class="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <p class="flex-1 text-sm font-medium text-red-800">{{ store.error() }}</p>
            <button class="btn-ghost text-red-600 hover:bg-red-100 text-xs" (click)="store.loadTrips()">
              Reintentar
            </button>
          </div>
        }

        <!-- Skeleton loaders — visibles mientras isLoading === true -->
        @if (store.isLoading()) {
          <div>
            <div class="skeleton h-4 w-32 rounded-lg mb-6"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (_ of skeletons; track $index) {
                <div class="card overflow-hidden flex">
                  <!-- Barra lateral -->
                  <div class="w-1 shrink-0 skeleton rounded-none"></div>
                  <!-- Contenido -->
                  <div class="flex-1 p-4 flex flex-col gap-3">
                    <!-- Fila superior -->
                    <div class="flex items-start gap-3">
                      <div class="skeleton w-10 h-10 rounded-xl shrink-0"></div>
                      <div class="flex-1 pt-0.5 space-y-2">
                        <div class="skeleton h-3.5 w-3/4 rounded-md"></div>
                        <div class="skeleton h-3 w-1/3 rounded-md"></div>
                      </div>
                    </div>
                    <!-- Chips -->
                    <div class="flex gap-2">
                      <div class="skeleton h-6 w-20 rounded-lg"></div>
                      <div class="skeleton h-6 w-16 rounded-lg"></div>
                      <div class="skeleton h-6 w-14 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

        <!-- Empty state — solo cuando la carga terminó Y no hay viajes -->
        } @else if (!store.trips().length) {
          <app-empty-state
            emoji="✈️"
            title="Aún no tienes viajes"
            description="Crea tu primer itinerario express y empieza a explorar el mundo parada a parada"
            actionLabel="Crear mi primer viaje"
            (action)="showModal.set(true)"
          />

        <!-- Grid — solo cuando la carga terminó Y hay viajes -->
        } @else {
          <div>
            <p class="section-title mb-5">{{ store.trips().length }} viaje{{ store.trips().length !== 1 ? 's' : '' }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (trip of store.trips(); track trip.id) {
                <app-trip-card
                  [trip]="trip"
                  (select)="onSelect($event)"
                  (delete)="onDelete($event)"
                />
              }
            </div>
          </div>
        }

      </div>
    </div>

    @if (showModal()) {
      <app-create-trip-modal
        (confirm)="onCreate($event)"
        (cancel)="showModal.set(false)"
      />
    }

    @if (tripToDelete()) {
      <app-confirm-modal
        title="Eliminar viaje"
        [description]="deleteDescription()"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        (confirm)="confirmDelete()"
        (cancel)="tripToDelete.set(null)"
      />
    }
  `,
})
export class TripListContainer implements OnInit {
  protected readonly store = inject(TripStore);
  private readonly router  = inject(Router);

  readonly showModal    = signal(false);
  readonly tripToDelete = signal<{ id: string; title: string } | null>(null);
  readonly skeletons    = Array(6);

  readonly totalSpots = computed(() =>
    this.store.trips().reduce((acc, t) => acc + t.spots.length, 0)
  );

  readonly deleteDescription = computed(() => {
    const t = this.tripToDelete();
    return t ? `¿Seguro que quieres eliminar "${t.title}"? Esta acción no se puede deshacer.` : '';
  });

  ngOnInit(): void {
    this.store.loadTrips();
  }

  scrollToTrips(): void {
    document.getElementById('trips-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  onSelect(id: string): void {
    this.router.navigate(['/trips', id]);
  }

  onDelete(id: string): void {
    const trip = this.store.trips().find(t => t.id === id);
    if (!trip) return;
    this.tripToDelete.set({ id: trip.id, title: trip.title });
  }

  async confirmDelete(): Promise<void> {
    const target = this.tripToDelete();
    if (!target) return;
    this.tripToDelete.set(null);
    await this.store.deleteTrip(target.id);
  }

  async onCreate(dto: CreateTripDto): Promise<void> {
    const trip = await this.store.createTrip(dto);
    this.showModal.set(false);
    this.router.navigate(['/trips', trip.id]);
  }
}
