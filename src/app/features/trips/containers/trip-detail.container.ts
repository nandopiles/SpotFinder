import { Component, ChangeDetectionStrategy, OnInit, inject, input, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TripStore } from '../../../core/services/trip.store';
import { MapSyncService } from '../../../core/services/map-sync.service';
import { TimelineComponent } from '../components/timeline.component';
import { MapComponent } from '../../map/components/map.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { ReorderSpotsDto, TripStatus } from '../../../core/models/trip.model';

const STATUS_COLORS: Record<TripStatus, { badge: string; dot: string }> = {
  draft:     { badge: 'bg-surface-subtle text-ink-muted',         dot: 'bg-ink-faint' },
  planned:   { badge: 'bg-primary-500/10 text-primary-400',       dot: 'bg-primary-500' },
  completed: { badge: 'bg-emerald-500/10 text-emerald-400',       dot: 'bg-emerald-500' },
};

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Borrador', planned: 'Planificado', completed: 'Completado',
};

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [TimelineComponent, MapComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.isLoading()) {
      <app-spinner [fullPage]="true" />

    } @else if (store.selectedTrip()) {

      <div class="flex flex-col h-[calc(100vh-3.5rem)]">

        <!-- Contextual header -->
        <div class="bg-surface border-b border-surface-border shrink-0">
          <div class="px-4 sm:px-6 py-3 flex items-center gap-3">

            <!-- Back button -->
            <button
              class="btn-icon shrink-0"
              (click)="goBack()"
              title="Volver a mis viajes"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <!-- Divider -->
            <div class="w-px h-6 bg-surface-border shrink-0"></div>

            <!-- Trip info -->
            <div class="flex-1 min-w-0 flex items-center gap-3">
              <div class="min-w-0">
                <h2 class="font-bold text-ink text-sm sm:text-base truncate leading-tight">
                  {{ store.selectedTrip()!.title }}
                </h2>
                <p class="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
                  <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                  {{ store.selectedTrip()!.city }}
                  <span class="text-surface-border-strong">·</span>
                  {{ store.selectedTrip()!.date }}
                </p>
              </div>

              <span class="badge shrink-0 hidden sm:inline-flex gap-1.5 {{ statusColor().badge }}">
                <span class="w-1.5 h-1.5 rounded-full shrink-0 {{ statusColor().dot }}"></span>
                {{ statusLabel() }}
              </span>
            </div>

            <!-- Spot count chip -->
            <div class="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5
                        rounded-xl bg-surface-subtle border border-surface-border text-xs">
              <svg class="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span class="font-semibold text-ink">{{ store.orderedSpots().length }}</span>
              <span class="text-ink-muted">paradas</span>
            </div>
          </div>
        </div>

        <!-- Split layout -->
        <div class="flex flex-1 overflow-hidden">

          <!-- Timeline panel -->
          <aside class="w-80 xl:w-96 shrink-0 flex flex-col bg-surface-muted
                        border-r border-surface-border overflow-hidden">

            <!-- Panel header -->
            <div class="px-4 pt-4 pb-2 shrink-0">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-ink">Itinerario</h3>
            <button class="btn-ghost text-xs py-1.5 px-2.5 text-primary-500 hover:bg-primary-500/10">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                  Añadir parada
                </button>
              </div>
            </div>

            <!-- Scrollable timeline -->
            <div class="flex-1 overflow-y-auto px-4 pb-4">
              <app-timeline
                [spots]="store.orderedSpots()"
                [selectedSpotId]="mapSync.selectedSpotId()"
                [hoveredSpotId]="mapSync.hoveredSpotId()"
                (reorder)="onReorder($event)"
                (hover)="mapSync.hoverSpot($event)"
                (select)="mapSync.selectSpot($event)"
              />
            </div>
          </aside>

          <!-- Map panel -->
          <div class="flex-1 relative bg-surface-subtle">
            <app-map
              [spots]="store.orderedSpots()"
              [center]="store.selectedTrip()!.centerCoordinates"
              [selectedSpotId]="mapSync.selectedSpotId()"
              [hoveredSpotId]="mapSync.hoveredSpotId()"
              (spotClick)="mapSync.selectSpot($event)"
              (spotHover)="mapSync.hoverSpot($event)"
            />

            <!-- Selected spot overlay -->
            @if (selectedSpot()) {
              <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400]
                          bg-surface rounded-2xl shadow-modal border border-surface-border
                          px-4 py-3 flex items-center gap-3 min-w-64 max-w-sm
                          animate-fade-up">
                <div class="w-8 h-8 rounded-xl bg-primary-600 text-white text-xs font-bold
                            flex items-center justify-center shrink-0">
                  {{ selectedSpot()!.order + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-ink truncate">{{ selectedSpot()!.name }}</p>
                  <p class="text-xs text-ink-muted">{{ selectedSpot()!.startTime }} · {{ selectedSpot()!.duration }}min</p>
                </div>
                <button
                  class="btn-icon shrink-0 w-7 h-7"
                  (click)="mapSync.selectSpot(null)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      </div>

    } @else {
      <div class="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-up">
        <div class="w-16 h-16 rounded-2xl bg-surface-subtle flex items-center justify-center">
          <svg class="w-8 h-8 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="text-center">
          <p class="font-semibold text-ink mb-1">Viaje no encontrado</p>
          <p class="text-sm text-ink-muted">Es posible que haya sido eliminado</p>
        </div>
        <button class="btn-primary" (click)="goBack()">Volver a mis viajes</button>
      </div>
    }
  `,
})
export class TripDetailContainer implements OnInit {
  readonly id = input.required<string>();

  protected readonly store = inject(TripStore);
  protected readonly mapSync = inject(MapSyncService);
  private readonly router = inject(Router);

  readonly selectedSpot = computed(() => {
    const id = this.mapSync.selectedSpotId();
    if (!id) return null;
    return this.store.orderedSpots().find(s => s.id === id) ?? null;
  });

  readonly statusColor = computed(() =>
    STATUS_COLORS[this.store.selectedTrip()?.status ?? 'draft']
  );

  readonly statusLabel = computed(() =>
    STATUS_LABELS[this.store.selectedTrip()?.status ?? 'draft']
  );

  ngOnInit(): void {
    this.store.loadTrip(this.id());
  }

  goBack(): void {
    this.router.navigate(['/trips']);
  }

  async onReorder(dto: ReorderSpotsDto): Promise<void> {
    const tripId = this.store.selectedTripId();
    if (!tripId) return;
    await this.store.reorderSpots(tripId, dto);
  }
}
