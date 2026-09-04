import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ActivitySpot, CATEGORY_META } from '../../../core/models/trip.model';

export type LegTransport = 'walking' | 'cycling' | 'transit' | 'driving';

export interface ScheduleItem {
  spot: ActivitySpot;
  /** Minutos de trayecto desde la parada anterior (null en la primera) */
  travelMinutes: number | null;
  /** Distancia en metros desde la parada anterior (null en la primera) */
  travelMeters: number | null;
  /** Modo de transporte activo del tramo previo (null en la primera parada) */
  travelMode: LegTransport | null;
  /** true si la hora planificada no es alcanzable por el trayecto */
  conflict: boolean;
  /** Hora sugerida de llegada real (solo si hay conflicto) */
  suggestedTime: string | null;
  /** Color del tramo que LLEGA a esta parada (null en la primera) */
  arriveColor: string | null;
  /** Color del tramo que SALE de esta parada (null en la última) */
  departColor: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  food:     '#f59e0b',
  culture:  '#8b5cf6',
  nature:   '#10b981',
  leisure:  '#3b82f6',
  shopping: '#ec4899',
};

@Component({
  selector: 'app-day-schedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!items().length) {
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-2xl bg-surface-subtle flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-ink-secondary mb-1">Sin paradas</p>
        <p class="text-xs text-ink-muted">Añade lugares para ver tu agenda del día</p>
      </div>
    } @else {
      <div class="relative pl-[92px]">
        @for (item of items(); track item.spot.id; let last = $last; let first = $first) {

          <!-- Trayecto desde la parada anterior -->
          @if (item.travelMinutes != null) {
            <div class="relative flex items-center py-2">
              <!-- Segmento de línea con el color del tramo -->
              <div class="absolute left-[-42px] top-0 bottom-0 w-1 rounded-full"
                   [style.background]="item.arriveColor"></div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                           border text-2xs font-semibold"
                    [style.borderColor]="item.arriveColor + '55'"
                    [style.background]="item.arriveColor + '14'"
                    [style.color]="item.arriveColor">
                <span>{{ modeIcon(item.travelMode) }}</span>
                <span class="tabular">{{ travelLabel(item) }}</span>
              </span>
            </div>
          }

          <!-- Bloque de parada -->
          <div class="relative mb-2">
            <!-- Hora + nodo comparten la misma fila superior para quedar alineados -->
            <!-- Nodo con número (carril propio) -->
            <div class="absolute -left-[46px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center
                        text-white text-[11px] font-bold border-2 border-surface tabular shadow-sm"
                 [style.background]="item.departColor ?? item.arriveColor ?? '#6366f1'">
              {{ item.spot.order + 1 }}
            </div>

            <!-- Hora (columna izquierda, centrada con el número del nodo) -->
            <div class="absolute -left-[92px] top-1.5 w-[44px] h-6 flex flex-col justify-center text-right leading-none">
              <p class="text-sm font-extrabold text-ink tabular">{{ item.spot.startTime }}</p>
            </div>
            <div class="absolute -left-[92px] top-[34px] w-[44px] text-right">
              <p class="text-2xs text-ink-faint tabular">{{ endTime(item.spot) }}</p>
            </div>

            <!-- Tarjeta con barra lateral del color de llegada -->
            <button type="button"
              class="relative w-full text-left rounded-xl border bg-surface p-3 pl-4 overflow-hidden
                     transition-all duration-150 hover:border-surface-border-strong"
              [class.border-surface-border]="!item.conflict"
              [style.borderColor]="item.conflict ? '#f59e0b' : null"
              (click)="select.emit(item.spot.id)"
              (mouseenter)="hover.emit(item.spot.id)"
              (mouseleave)="hover.emit(null)">
              <!-- Barra del color del tramo de salida -->
              <div class="absolute left-0 top-0 bottom-0 w-1.5"
                   [style.background]="item.departColor ?? item.arriveColor ?? color(item.spot.category)"></div>

              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <h4 class="text-sm font-bold text-ink truncate">{{ item.spot.name }}</h4>
                  <p class="text-2xs text-ink-muted truncate mt-0.5 flex items-center gap-1">
                    <svg class="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                    </svg>
                    {{ item.spot.address }}
                  </p>
                </div>
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-base shrink-0"
                      [style.background]="color(item.spot.category) + '1a'">
                  {{ emoji(item.spot.category) }}
                </span>
              </div>

              <div class="flex items-center gap-2 mt-2.5">
                <span class="chip tabular">
                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ durationLabel(item.spot.duration) }}
                </span>
                @if (item.conflict) {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-semibold
                               bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    Ajustar a {{ item.suggestedTime }}
                  </span>
                }
              </div>
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class DayScheduleComponent {
  readonly items = input.required<ScheduleItem[]>();

  readonly select = output<string>();
  readonly hover  = output<string | null>();

  emoji(category: string): string {
    return CATEGORY_META[category as keyof typeof CATEGORY_META]?.emoji ?? '📍';
  }

  color(category: string): string {
    return CATEGORY_COLORS[category] ?? '#6366f1';
  }

  conflictClass(item: ScheduleItem): boolean {
    return item.conflict;
  }

  endTime(spot: ActivitySpot): string {
    const [h, m] = spot.startTime.split(':').map(Number);
    const total = (h || 0) * 60 + (m || 0) + spot.duration;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  }

  durationLabel(d: number): string {
    return d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d} min`;
  }

  travelLabel(item: ScheduleItem): string {
    const min = item.travelMinutes ?? 0;
    const meters = item.travelMeters;
    const dist = meters == null ? '' : meters >= 1000
      ? ` · ${(meters / 1000).toFixed(1)} km`
      : ` · ${Math.round(meters)} m`;
    const time = min < 1 ? '<1 min' : `${min} min`;
    return `${time}${dist}`;
  }

  modeIcon(mode: LegTransport | null): string {
    const icons: Record<LegTransport, string> = {
      walking: '🚶', cycling: '🚲', transit: '🚆', driving: '🚗',
    };
    return mode ? icons[mode] : '🚶';
  }
}
