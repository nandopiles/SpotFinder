import { Component, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Trip, TripStatus } from '../../../core/models/trip.model';

const CITY_COLORS: string[] = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#3b82f6',
];

const CITY_COLORS_SECONDARY: string[] = [
  '#8b5cf6', '#a78bfa', '#f472b6', '#fb923c', '#2dd4bf', '#60a5fa',
];

const STATUS_META: Record<TripStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: 'Borrador',    color: 'var(--color-ink-muted)',  bg: 'var(--color-surface-subtle)', dot: 'var(--color-ink-faint)' },
  planned:   { label: 'Planificado', color: '#818cf8',                 bg: 'rgba(99,102,241,0.15)',        dot: '#6366f1' },
  completed: { label: 'Completado',  color: '#34d399',                 bg: 'rgba(16,185,129,0.15)',        dot: '#10b981' },
};

const CITY_EMOJIS: string[] = ['🗺️', '✈️', '🏙️', '🌍', '📍', '🧭'];

function cityIndex(city: string): number {
  return city.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function cityColor(city: string): string  { return CITY_COLORS[cityIndex(city) % CITY_COLORS.length]; }
function cityColor2(city: string): string { return CITY_COLORS_SECONDARY[cityIndex(city) % CITY_COLORS_SECONDARY.length]; }
function cityEmoji(city: string): string  { return CITY_EMOJIS[cityIndex(city) % CITY_EMOJIS.length]; }

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [DatePipe],
  template: `
    <article
      class="card-interactive overflow-hidden cursor-pointer flex flex-col"
      (click)="select.emit(trip().id)"
    >
      <!-- Header con gradiente de color de ciudad -->
      <div class="relative h-28 shrink-0 overflow-hidden"
           [style.background]="'linear-gradient(135deg, ' + color() + ' 0%, ' + color2() + ' 100%)'">

        <!-- Patrón de puntos decorativo -->
        <div class="absolute inset-0 opacity-20"
             style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 18px 18px;"></div>

        <!-- Emoji ciudad grande -->
        <div class="absolute bottom-3 left-4 text-4xl select-none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
          {{ emoji() }}
        </div>

        <!-- Botón eliminar -->
        <button
          class="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center
                 transition-all duration-150"
          style="background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.7)"
          (mouseenter)="onDeleteHover($event, true)"
          (mouseleave)="onDeleteHover($event, false)"
          (click)="$event.stopPropagation(); delete.emit(trip().id)"
          title="Eliminar"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>

        <!-- Badge de estado -->
        <div class="absolute top-2.5 left-3">
          <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                style="background: rgba(0,0,0,0.25); color: rgba(255,255,255,0.95); backdrop-filter: blur(4px)">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-white opacity-80"></span>
            {{ statusMeta().label }}
          </span>
        </div>
      </div>

      <!-- Cuerpo -->
      <div class="flex-1 flex flex-col p-4 gap-3">

        <!-- Título + ciudad -->
        <div>
          <h3 class="font-bold text-base leading-tight line-clamp-1 text-ink">{{ trip().title }}</h3>
          <p class="text-xs mt-1 flex items-center gap-1 text-ink-muted">
            <svg style="width:10px;height:10px;flex-shrink:0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            {{ trip().city }}
          </p>
        </div>

        <!-- Separador -->
        <div class="h-px bg-surface-border"></div>

        <!-- Fila de métricas -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Fecha -->
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-xs font-medium text-ink-secondary">{{ trip().date | date:'d MMM' }}</span>
            </div>
            <!-- Paradas -->
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span class="text-xs font-medium text-ink-secondary">
                <strong class="font-bold text-ink">{{ trip().spots.length }}</strong>
                parada{{ trip().spots.length !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- CTA -->
          <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg
                       text-primary-500 bg-primary-500/10">
            Ver
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </article>
  `,
})
export class TripCardComponent {
  readonly trip   = input.required<Trip>();
  readonly select = output<string>();
  readonly delete = output<string>();

  readonly statusMeta = computed(() => STATUS_META[this.trip().status]);
  readonly color      = computed(() => cityColor(this.trip().city));
  readonly color2     = computed(() => cityColor2(this.trip().city));
  readonly emoji      = computed(() => cityEmoji(this.trip().city));

  onDeleteHover(event: MouseEvent, entering: boolean): void {
    const el = event.currentTarget as HTMLElement;
    el.style.background = entering ? 'rgba(239,68,68,0.8)' : 'rgba(0,0,0,0.2)';
    el.style.color      = 'rgba(255,255,255,0.95)';
  }
}
