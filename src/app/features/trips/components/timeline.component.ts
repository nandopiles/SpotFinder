import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivitySpot, ReorderSpotsDto, TransportMode } from '../../../core/models/trip.model';
import { LegOptions } from '../../../core/services/routing.service';
import { ScheduleItem } from './day-schedule.component';
import { SpotCardComponent } from './spot-card.component';
import { TransportPickerComponent } from './transport-picker.component';

const MODE_ICON: Record<TransportMode, string> = {
  walking: '🚶', cycling: '🚲', transit: '🚆', driving: '🚗',
};

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [DragDropModule, SpotCardComponent, TransportPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (spots().length) {
      <!-- Section header -->
      <div class="flex items-center justify-between mb-4 px-1">
        <p class="section-title">{{ spots().length }} parada{{ spots().length !== 1 ? 's' : '' }}</p>
        <p class="text-2xs text-ink-faint">Arrastra para reordenar</p>
      </div>
    }

    <div
      cdkDropList
      class="flex flex-col gap-0"
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (spot of spots(); track spot.id; let last = $last; let i = $index) {
        <div cdkDrag [cdkDragData]="spot">

          <!-- Aviso de conflicto horario -->
          @if (info(spot.id); as meta) {
            @if (meta.conflict) {
              <div class="flex items-center gap-2 mb-1.5 ml-1 px-2.5 py-1.5 rounded-lg
                          bg-amber-500/10 border border-amber-500/25">
                <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p class="text-2xs font-medium text-amber-600 dark:text-amber-400 leading-tight">
                  Llegarás sobre las <strong>{{ meta.suggestedTime }}</strong>, no a las {{ spot.startTime }}
                </p>
              </div>
            }
          }

          <app-spot-card
            [spot]="spot"
            [isSelected]="selectedSpotId() === spot.id"
            [isHovered]="hoveredSpotId() === spot.id"
            (hover)="hover.emit($event)"
            (select)="select.emit($event)"
            (edit)="edit.emit($event)"
            (remove)="remove.emit($event)"
          />

          <!-- Connector con transporte por tramo -->
          @if (!last) {
            <div class="flex items-start gap-2 ml-[26px] my-1">
              <!-- Línea vertical con nodo de color del tramo -->
              <div class="flex flex-col items-center self-stretch pt-1">
                <div class="w-2 h-2 rounded-full -ml-[3.5px] shrink-0"
                     [style.background]="segmentColor(i)"></div>
                <div class="w-px flex-1 mt-0.5" [style.background]="segmentColor(i)" [style.opacity]="0.35"></div>
              </div>

              <div class="flex-1 pb-1">
                @if (leg(i); as legData) {
                  <!-- Resumen clicable -->
                  <button type="button"
                    class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
                           bg-surface-subtle border border-surface-border
                           text-2xs font-medium text-ink-secondary hover:border-surface-border-strong
                           transition-colors duration-150"
                    (click)="toggle(i)">
                    <span>{{ modeIcon(i) }}</span>
                    <span class="tabular">{{ travelLabelFor(i + 1) }}</span>
                    <svg class="w-2.5 h-2.5 text-ink-faint transition-transform duration-150"
                         [style.transform]="isOpen(i) ? 'rotate(180deg)' : 'none'"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <!-- Picker desplegable -->
                  @if (isOpen(i)) {
                    <div class="mt-1.5">
                      <app-transport-picker
                        [leg]="legData"
                        [active]="activeMode(i)"
                        [color]="segmentColor(i)"
                        (select)="onPick(i, $event)"
                      />
                    </div>
                  }
                }
              </div>
            </div>
          }

          <!-- CDK placeholder -->
          <ng-template cdkDragPlaceholder>
            <div class="h-[72px] rounded-2xl border-2 border-dashed border-primary-500/30
                        bg-primary-500/5 mx-0 my-0.5 flex items-center justify-center">
              <p class="text-xs text-primary-400 font-medium">Soltar aquí</p>
            </div>
          </ng-template>
        </div>

      } @empty {
        <div class="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
          <div class="w-16 h-16 rounded-2xl bg-surface-subtle flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-ink-secondary mb-1">Sin paradas</p>
          <p class="text-xs text-ink-muted">Añade lugares a tu itinerario</p>
        </div>
      }
    </div>
  `,
})
export class TimelineComponent {
  readonly spots = input.required<ActivitySpot[]>();
  readonly selectedSpotId = input<string | null>(null);
  readonly hoveredSpotId = input<string | null>(null);
  readonly schedule = input<ScheduleItem[]>([]);
  readonly legOptions = input<LegOptions[]>([]);
  readonly legModes = input<TransportMode[]>([]);
  readonly segmentColors = input<string[]>([]);

  readonly reorder = output<ReorderSpotsDto>();
  readonly hover = output<string | null>();
  readonly select = output<string>();
  readonly edit = output<string>();
  readonly remove = output<string>();
  readonly legModeChange = output<{ index: number; mode: TransportMode }>();

  /** Índice del tramo con el picker abierto (-1 = ninguno) */
  private readonly openLeg = signal(-1);

  private readonly scheduleById = computed(() => {
    const map = new Map<string, ScheduleItem>();
    for (const item of this.schedule()) map.set(item.spot.id, item);
    return map;
  });

  info(spotId: string): ScheduleItem | undefined {
    return this.scheduleById().get(spotId);
  }

  leg(index: number): LegOptions | undefined {
    return this.legOptions()[index];
  }

  activeMode(index: number): TransportMode {
    return this.legModes()[index] ?? this.legOptions()[index]?.recommended ?? 'walking';
  }

  modeIcon(index: number): string {
    return MODE_ICON[this.activeMode(index)];
  }

  segmentColor(index: number): string {
    return this.segmentColors()[index] ?? '#6366f1';
  }

  isOpen(index: number): boolean {
    return this.openLeg() === index;
  }

  toggle(index: number): void {
    this.openLeg.update(cur => (cur === index ? -1 : index));
  }

  onPick(index: number, mode: TransportMode): void {
    this.legModeChange.emit({ index, mode });
    this.openLeg.set(-1);
  }

  /** Etiqueta de trayecto para la parada en el índice dado (destino del tramo) */
  travelLabelFor(index: number): string | null {
    const item = this.schedule()[index];
    if (!item || item.travelMinutes == null) return null;
    const min = item.travelMinutes;
    const meters = item.travelMeters;
    const dist = meters == null ? '' : meters >= 1000
      ? ` · ${(meters / 1000).toFixed(1)} km`
      : ` · ${Math.round(meters)} m`;
    const time = min < 1 ? '<1 min' : `${min} min`;
    return `${time}${dist}`;
  }

  onDrop(event: CdkDragDrop<ActivitySpot[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const items = [...this.spots()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.reorder.emit(items.map((s, i) => ({ spotId: s.id, order: i })));
  }
}
