import { Component, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Trip, TripStatus } from '../../../core/models/trip.model';

const CITY_COLORS: string[] = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#3b82f6',
];

const STATUS_META: Record<TripStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: 'Borrador',    color: 'var(--color-ink-muted)',  bg: 'var(--color-surface-subtle)', dot: 'var(--color-ink-faint)' },
  planned:   { label: 'Planificado', color: '#818cf8',                 bg: 'rgba(99,102,241,0.12)',        dot: '#6366f1' },
  completed: { label: 'Completado',  color: '#34d399',                 bg: 'rgba(16,185,129,0.12)',        dot: '#10b981' },
};

function cityColor(city: string): string {
  const hash = city.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CITY_COLORS[hash % CITY_COLORS.length];
}

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [DatePipe],
  template: `
    <article
      class="card-interactive overflow-hidden cursor-pointer flex"
      (click)="select.emit(trip().id)"
    >
      <!-- Barra lateral de color -->
      <div class="w-1 shrink-0 rounded-l-2xl" [style.background]="color()"></div>

      <!-- Contenido -->
      <div class="flex-1 flex flex-col min-w-0 p-4 gap-3">

        <!-- Fila superior: avatar + texto + delete -->
        <div class="flex items-start gap-3">
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      text-white text-sm font-bold select-none"
               [style.background]="color()" style="opacity: 0.9">
            {{ trip().city.slice(0, 2).toUpperCase() }}
          </div>

          <!-- Título + ciudad -->
          <div class="flex-1 min-w-0 pt-0.5">
            <h3 class="font-semibold text-sm leading-tight line-clamp-1 text-ink">{{ trip().title }}</h3>
            <p class="text-xs mt-0.5 flex items-center gap-1 text-ink-muted">
              <svg style="width:10px;height:10px;flex-shrink:0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              {{ trip().city }}
            </p>
          </div>

          <!-- Botón eliminar -->
          <button
            class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                   transition-colors duration-150"
            [style.color]="'var(--color-ink-faint)'"
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
        </div>

        <!-- Fila inferior: chips de info -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Estado -->
          <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                [style.background]="statusMeta().bg"
                [style.color]="statusMeta().color">
            <span class="w-1.5 h-1.5 rounded-full shrink-0"
                  [style.background]="statusMeta().dot"></span>
            {{ statusMeta().label }}
          </span>

          <!-- Fecha -->
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                       bg-surface-subtle text-ink-muted">
            <svg style="width:10px;height:10px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            {{ trip().date | date:'d MMM' }}
          </span>

          <!-- Paradas -->
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                       bg-surface-subtle text-ink-muted">
            <svg style="width:10px;height:10px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            <strong class="text-ink-secondary font-semibold">{{ trip().spots.length }}</strong>
            &nbsp;parada{{ trip().spots.length !== 1 ? 's' : '' }}
          </span>

          <!-- Flecha -->
          <span class="ml-auto text-xs font-semibold flex items-center gap-0.5 text-primary-500">
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

  onDeleteHover(event: MouseEvent, entering: boolean): void {
    const el = event.currentTarget as HTMLElement;
    el.style.color      = entering ? '#ef4444' : 'var(--color-ink-faint)';
    el.style.background = entering ? '#fef2f2' : 'transparent';
  }
}
