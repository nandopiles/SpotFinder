import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, input, computed, signal, effect, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, formatDate } from '@angular/common';
import { TripStore } from '../../../core/services/trip.store';
import { MapSyncService } from '../../../core/services/map-sync.service';
import { UiStateService } from '../../../core/services/ui-state.service';
import { RoutingService, LegOptions } from '../../../core/services/routing.service';
import { PhotonService } from '../../../core/services/photon.service';
import { PdfExportService, PdfStop } from '../../../core/services/pdf-export.service';
import { TimelineComponent } from '../components/timeline.component';
import { DayScheduleComponent, ScheduleItem } from '../components/day-schedule.component';
import { MapComponent } from '../../map/components/map.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { ReorderSpotsDto, TripStatus, UpdateTripDto, CreateSpotDto, UpdateSpotDto, Coordinates, ActivitySpot, TransportMode, CATEGORY_META, spotDuration, formatDuration } from '../../../core/models/trip.model';

const STATUS_COLORS: Record<TripStatus, { badge: string; dot: string }> = {
  draft:     { badge: 'bg-surface-subtle text-ink-muted',         dot: 'bg-ink-faint' },
  planned:   { badge: 'bg-primary-500/10 text-primary-400',       dot: 'bg-primary-500' },
  completed: { badge: 'bg-emerald-500/10 text-emerald-400',       dot: 'bg-emerald-500' },
};

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Borrador', planned: 'Planificado', completed: 'Completado',
};

function colorSecondary(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.4).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [TimelineComponent, DayScheduleComponent, MapComponent, SpinnerComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.isLoading()) {
      <app-spinner [fullPage]="true" />

    } @else if (store.selectedTrip()) {

      <div class="flex flex-col h-[calc(100vh-4rem)]">

        <!-- Contextual header -->
        <div class="bg-surface border-b border-surface-border shrink-0"
             style="box-shadow: var(--shadow-xs)">
          <div class="px-3 sm:px-5 py-3 flex items-center gap-3">

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

            <!-- Icono del viaje -->
            <div class="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-xl select-none hidden sm:flex"
                 [style.background]="'linear-gradient(135deg, ' + tripColor() + ' 0%, ' + tripColor2() + ' 100%)'"
                 style="box-shadow: var(--shadow-sm)">
              <span style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25))">{{ store.selectedTrip()!.icon }}</span>
            </div>

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
                  <span class="truncate">{{ store.selectedTrip()!.city }}</span>
                  <span class="text-surface-border-strong">·</span>
                  <span class="shrink-0">{{ store.selectedTrip()!.date | date:'d MMM yyyy' }}</span>
                </p>
              </div>
              <span class="badge shrink-0 hidden sm:inline-flex gap-1.5 {{ statusColor().badge }}">
                <span class="w-1.5 h-1.5 rounded-full shrink-0 {{ statusColor().dot }}"></span>
                {{ statusLabel() }}
              </span>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="hidden md:flex items-center gap-1.5 px-3 py-1.5
                          rounded-xl bg-surface-subtle border border-surface-border text-xs">
                <svg class="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <span class="font-bold text-ink tabular">{{ store.orderedSpots().length }}</span>
                <span class="text-ink-muted">paradas</span>
              </div>
              <button class="btn-secondary text-xs py-2 px-3.5 gap-1.5" (click)="openEditPanel()">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span class="hidden sm:inline">Editar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Split layout -->
        <div class="flex flex-1 overflow-hidden">

          <!-- Timeline panel -->
          <aside class="itinerary-panel w-80 xl:w-96 shrink-0 flex flex-col bg-surface
                        border-r border-surface-border overflow-hidden
                        relative" style="z-index: 500; box-shadow: 2px 0 12px -2px rgb(0 0 0 / 0.12)">

            <!-- Panel header -->
            <div class="px-4 pt-4 pb-3 shrink-0 border-b border-surface-border space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                  </div>
                  <h3 class="text-sm font-bold text-ink">Itinerario</h3>
                </div>
                <button class="inline-flex items-center gap-1 text-xs font-semibold py-1.5 px-2.5 rounded-lg
                               text-brand bg-brand/10 hover:bg-primary-600 hover:text-white
                               transition-all duration-150"
                        (click)="openAddSpot()">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                  Añadir
                </button>
              </div>

              <!-- Toggle vista + exportar -->
              <div class="flex items-center gap-2">
                <div class="flex p-0.5 rounded-lg bg-surface-subtle border border-surface-border">
                  <button class="px-2.5 py-1 rounded-md text-2xs font-semibold transition-all duration-150"
                          [class.bg-surface]="viewMode() === 'timeline'"
                          [class.text-ink]="viewMode() === 'timeline'"
                          [class.shadow-sm]="viewMode() === 'timeline'"
                          [class.text-ink-muted]="viewMode() !== 'timeline'"
                          (click)="setView('timeline')">
                    Lista
                  </button>
                  <button class="px-2.5 py-1 rounded-md text-2xs font-semibold transition-all duration-150"
                          [class.bg-surface]="viewMode() === 'day'"
                          [class.text-ink]="viewMode() === 'day'"
                          [class.shadow-sm]="viewMode() === 'day'"
                          [class.text-ink-muted]="viewMode() !== 'day'"
                          (click)="setView('day')">
                    Modo día
                  </button>
                </div>

                <div class="flex-1"></div>

                <button class="btn-icon w-8 h-8" title="Descargar PDF" (click)="exportPdf()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                </button>
              </div>

              <!-- Resumen: trayecto total + aviso de conflictos -->
              @if (store.orderedSpots().length > 1) {
                <div class="flex items-center gap-2 text-2xs">
                  <span class="chip">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ totalTravelMin() }} min a pie
                  </span>
                  @if (hasConflicts()) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold
                                 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      ⚠ Conflictos de horario
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold
                                 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      ✓ Horario viable
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Scrollable content: lista o agenda -->
            <div class="flex-1 overflow-y-auto px-4 pb-4 pt-3">
              @if (viewMode() === 'timeline') {
                <app-timeline
                  [spots]="store.orderedSpots()"
                  [selectedSpotId]="mapSync.selectedSpotId()"
                  [hoveredSpotId]="mapSync.hoveredSpotId()"
                  [schedule]="schedule()"
                  [legOptions]="legOptions()"
                  [legModes]="legModes()"
                  [segmentColors]="SEGMENT_COLORS"
                  (reorder)="onReorder($event)"
                  (hover)="mapSync.hoverSpot($event)"
                  (select)="mapSync.selectSpot($event)"
                  (edit)="openEditSpot($event)"
                  (remove)="onRemoveSpot($event)"
                  (legModeChange)="setLegMode($event.index, $event.mode)"
                />
              } @else {
                <app-day-schedule
                  [items]="schedule()"
                  (select)="mapSync.selectSpot($event)"
                  (hover)="mapSync.hoverSpot($event)"
                />
              }
            </div>
          </aside>

          <!-- Map panel -->
          <div class="flex-1 relative bg-surface-subtle" style="isolation: isolate">
            <app-map
              [spots]="store.orderedSpots()"
              [center]="store.selectedTrip()!.centerCoordinates"
              [selectedSpotId]="mapSync.selectedSpotId()"
              [hoveredSpotId]="mapSync.hoveredSpotId()"
              [routeSegments]="routeSegments()"
              (spotClick)="mapSync.selectSpot($event)"
              (spotHover)="mapSync.hoverSpot($event)"
              (mapClick)="onMapClick($event)"
            />

            <!-- Hint para añadir por click -->
            <div class="absolute top-3 left-1/2 -translate-x-1/2 z-[400] pointer-events-none
                        px-3 py-1.5 rounded-full bg-surface/90 border border-surface-border
                        text-2xs font-medium text-ink-muted shadow-sm hidden sm:block"
                 style="backdrop-filter: blur(8px)">
              💡 Haz click en el mapa para añadir una parada
            </div>

            <!-- Selected spot overlay -->
            @if (selectedSpot()) {
              <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400]
                          bg-surface rounded-2xl shadow-modal border border-surface-border
                          pl-3 pr-2.5 py-2.5 flex items-center gap-3 min-w-72 max-w-sm
                          animate-fade-up">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-bold
                            flex items-center justify-center shrink-0 tabular"
                     style="box-shadow: 0 3px 8px -2px rgba(79,70,229,0.5)">
                  {{ selectedSpot()!.order + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-ink truncate">{{ selectedSpot()!.name }}</p>
                  <p class="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
                    <span class="inline-flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ selectedSpot()!.startTime }} – {{ selectedSpot()!.endTime }}
                    </span>
                    <span class="text-surface-border-strong">·</span>
                    <span>{{ durationText(selectedSpot()!) }}</span>
                  </p>
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
export class TripDetailContainer implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  protected readonly store   = inject(TripStore);
  protected readonly mapSync = inject(MapSyncService);
  private readonly router    = inject(Router);
  private readonly ui        = inject(UiStateService);

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

  readonly tripColor  = computed(() => this.store.selectedTrip()?.color ?? '#6366f1');
  readonly tripColor2 = computed(() => colorSecondary(this.store.selectedTrip()?.color ?? '#6366f1'));

  // ── Vista: timeline (lista) o day (agenda horaria) ──
  readonly viewMode = signal<'timeline' | 'day'>('timeline');

  // ── Rutas reales (OSRM) entre paradas consecutivas ──
  private readonly routing = inject(RoutingService);
  private readonly photon  = inject(PhotonService);
  private readonly pdf     = inject(PdfExportService);
  /** legOptions[i] = opciones de transporte del tramo parada i -> i+1 */
  readonly legOptions = signal<LegOptions[]>([]);
  /** Modo elegido por el usuario por tramo (null = usar el recomendado) */
  private readonly legModeOverrides = signal<(TransportMode | null)[]>([]);

  /** Modo activo (elegido o recomendado) por tramo */
  readonly legModes = computed<TransportMode[]>(() => {
    const opts = this.legOptions();
    const overrides = this.legModeOverrides();
    return opts.map((o, i) => overrides[i] ?? o.recommended);
  });

  /** Colores por tramo para diferenciarlos en el mapa y la UI */
  readonly SEGMENT_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
  ];

  segmentColor(i: number): string {
    return this.SEGMENT_COLORS[i % this.SEGMENT_COLORS.length];
  }

  /** Segmentos de ruta con su geometría y color, para dibujar en el mapa */
  readonly routeSegments = computed(() =>
    this.legOptions().map((o, i) => ({ geometry: o.geometry, color: this.segmentColor(i) }))
  );

  /** Duración (s) del modo activo por tramo */
  private durationOf(i: number): number {
    const opt = this.legOptions()[i];
    if (!opt) return 0;
    const mode = this.legModes()[i];
    return opt.options.find(o => o.mode === mode)?.duration ?? 0;
  }

  /**
   * Análisis del horario: para cada parada calcula la hora de llegada real
   * (encadenando duración + trayecto) y marca conflicto si su hora de inicio
   * planificada es anterior a la hora en que realmente puede llegar.
   */
  readonly schedule = computed<ScheduleItem[]>(() => {
    const spots = this.store.orderedSpots();
    const opts = this.legOptions();
    const modes = this.legModes();
    const items: ScheduleItem[] = [];
    let prevEnd: number | null = null;   // minutos desde medianoche

    spots.forEach((spot, i) => {
      const planned = this.toMinutes(spot.startTime);
      const travelSec = i > 0 ? this.durationOf(i - 1) : 0;
      const travelMin = Math.round(travelSec / 60);
      const earliest = prevEnd !== null ? prevEnd + travelMin : planned;
      const conflict = prevEnd !== null && planned < earliest;

      const isLast = i === spots.length - 1;
      items.push({
        spot,
        travelMinutes: i > 0 ? travelMin : null,
        travelMeters:  i > 0 ? (opts[i - 1]?.distance ?? null) : null,
        travelMode:    i > 0 ? (modes[i - 1] ?? null) : null,
        conflict,
        suggestedTime: conflict ? this.toHHMM(earliest) : null,
        arriveColor:   i > 0 ? this.segmentColor(i - 1) : null,
        departColor:   !isLast ? this.segmentColor(i) : null,
      });

      prevEnd = Math.max(planned, earliest) + spotDuration(spot);
    });

    return items;
  });

  readonly hasConflicts = computed(() => this.schedule().some(i => i.conflict));

  /** Total de tiempo en trayectos (min) con los modos activos */
  readonly totalTravelMin = computed(() =>
    Math.round(this.legOptions().reduce((acc, _, i) => acc + this.durationOf(i), 0) / 60)
  );

  constructor() {
    // Recalcula rutas reales cuando cambian las paradas (orden o coordenadas)
    effect(() => {
      const spots = this.store.orderedSpots();
      this.computeRoutes(spots);
    });
  }

  ngOnInit(): void {
    this.store.loadTrip(this.id());
  }

  private async computeRoutes(spots: ActivitySpot[]): Promise<void> {
    if (spots.length < 2) {
      this.legOptions.set([]);
      this.legModeOverrides.set([]);
      return;
    }
    const pairs = spots.slice(0, -1).map((s, i) => [s, spots[i + 1]] as const);
    const results = await Promise.all(
      pairs.map(([a, b]) => this.routing.legOptions(a.coordinates, b.coordinates))
    );
    // Actualización atómica: opciones + reset de overrides al nuevo tamaño
    this.legOptions.set(results);
    this.legModeOverrides.set(results.map(() => null));
  }

  /** El usuario elige un modo de transporte para un tramo concreto */
  setLegMode(index: number, mode: TransportMode): void {
    this.legModeOverrides.update(arr => {
      const next = [...arr];
      next[index] = mode;
      return next;
    });
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private toHHMM(min: number): string {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.ui.editPanelState.set('closed');
    this.ui.editPanelTrip.set(null);
    this.ui.editPanelSave.set(null);
    this.ui.addSpotOpen.set(false);
    this.ui.addSpotConfirm.set(null);
    this.ui.editSpotState.set('closed');
    this.ui.editSpotSpot.set(null);
    this.ui.editSpotSave.set(null);
    this.ui.confirmSpotDeleteOpen.set(false);
    this.ui.confirmSpotDelete.set(null);
  }

  openEditPanel(): void {
    const trip = this.store.selectedTrip();
    if (!trip) return;
    this.ui.editPanelTrip.set(trip);
    this.ui.editPanelSave.set((dto: UpdateTripDto) => this.onUpdate(dto));
    this.ui.editPanelState.set('open');
  }

  goBack(): void {
    this.router.navigate(['/trips']);
  }

  openAddSpot(): void {
    const trip = this.store.selectedTrip();
    if (!trip) return;
    this.ui.addSpotBias.set(trip.centerCoordinates);
    this.ui.addSpotConfirm.set((dto: CreateSpotDto) => this.onAddSpot(dto));
    this.ui.addSpotOpen.set(true);
  }

  async onAddSpot(dto: CreateSpotDto): Promise<void> {
    const tripId = this.store.selectedTripId();
    if (!tripId) return;
    await this.store.addSpot(tripId, dto);
  }

  async onUpdate(dto: UpdateTripDto): Promise<void> {
    const tripId = this.store.selectedTripId();
    if (!tripId) return;
    await this.store.updateTrip(tripId, dto);
  }

  async onReorder(dto: ReorderSpotsDto): Promise<void> {
    const tripId = this.store.selectedTripId();
    if (!tripId) return;
    await this.store.reorderSpots(tripId, dto);
  }

  openEditSpot(spotId: string): void {
    const spot = this.store.orderedSpots().find(s => s.id === spotId);
    if (!spot) return;
    this.ui.editSpotSpot.set(spot);
    this.ui.editSpotSave.set((dto: UpdateSpotDto) => this.onUpdateSpot(spotId, dto));
    this.ui.editSpotState.set('open');
  }

  async onUpdateSpot(spotId: string, dto: UpdateSpotDto): Promise<void> {
    const tripId = untracked(this.store.selectedTripId);
    if (!tripId) return;
    await this.store.updateSpot(tripId, spotId, dto);
  }

  onRemoveSpot(spotId: string): void {
    const spot = this.store.orderedSpots().find(s => s.id === spotId);
    if (!spot) return;
    this.ui.confirmSpotDeleteName.set(spot.name);
    this.ui.confirmSpotDelete.set(() => this.performDeleteSpot(spot.id));
    this.ui.confirmSpotDeleteOpen.set(true);
  }

  private async performDeleteSpot(spotId: string): Promise<void> {
    const tripId = untracked(this.store.selectedTripId);
    if (!tripId) return;
    // Si la parada borrada estaba seleccionada en el mapa, deseleccionar
    if (untracked(this.mapSync.selectedSpotId) === spotId) {
      this.mapSync.selectSpot(null);
    }
    await this.store.deleteSpot(tripId, spotId);
  }

  async onMapClick(coords: Coordinates): Promise<void> {
    const trip = this.store.selectedTrip();
    if (!trip) return;
    // Resolver el lugar del punto pulsado y abrir el modal precargado
    const place = await this.photon.reverse(coords);
    this.ui.addSpotBias.set(trip.centerCoordinates);
    this.ui.addSpotPlace.set(place);
    this.ui.addSpotConfirm.set((dto: CreateSpotDto) => this.onAddSpot(dto));
    this.ui.addSpotOpen.set(true);
  }

  setView(mode: 'timeline' | 'day'): void {
    this.viewMode.set(mode);
  }

  exportPdf(): void {
    const trip = this.store.selectedTrip();
    if (!trip) return;
    const items = this.schedule();

    const stops: PdfStop[] = items.map(item => ({
      order: item.spot.order + 1,
      name: item.spot.name,
      address: item.spot.address,
      startTime: item.spot.startTime,
      endTime: this.endTimeOf(item.spot),
      durationLabel: this.durationText(item.spot),
      categoryLabel: CATEGORY_META[item.spot.category]?.label ?? 'Actividad',
      color: item.departColor ?? item.arriveColor ?? trip.color ?? '#6366f1',
      notes: item.spot.notes || undefined,
      travel: item.travelMinutes != null ? this.travelText(item) : null,
    }));

    let dateLabel = trip.date;
    try {
      dateLabel = formatDate(trip.date, 'EEEE, d MMMM y', 'es');
    } catch { /* deja la fecha en crudo si el formato falla */ }

    this.pdf.export({
      title: trip.title,
      city: trip.city,
      dateLabel,
      stopsCount: this.store.orderedSpots().length,
      totalTravelLabel: `${this.totalTravelMin()} min`,
      accent: trip.color ?? '#6366f1',
      stops,
    });
  }

  durationText(spot: ActivitySpot): string {
    return formatDuration(spotDuration(spot));
  }

  travelText(item: ScheduleItem): string {
    const min = item.travelMinutes ?? 0;
    const meters = item.travelMeters;
    const dist = meters == null ? '' : meters >= 1000
      ? ` (${(meters / 1000).toFixed(1)} km)`
      : ` (${Math.round(meters)} m)`;
    const time = min < 1 ? 'menos de 1 min' : `${min} min`;
    const modeLabel: Record<string, string> = {
      walking: 'a pie', cycling: 'en bici', transit: 'en transporte', driving: 'en coche',
    };
    const mode = item.travelMode ? ` ${modeLabel[item.travelMode]}` : '';
    return `${time}${mode}${dist}`;
  }

  endTimeOf(spot: ActivitySpot): string {
    return spot.endTime;
  }
}
