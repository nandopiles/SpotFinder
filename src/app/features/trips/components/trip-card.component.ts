import { Component, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Trip, TripStatus } from '../../../core/models/trip.model';

const STATUS_META: Record<TripStatus, { label: string }> = {
  draft:     { label: 'Borrador' },
  planned:   { label: 'Planificado' },
  completed: { label: 'Completado' },
};

function colorSecondary(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.4).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [DatePipe],
  template: `
    <article
      class="group card-interactive overflow-hidden cursor-pointer flex flex-col"
      (click)="select.emit(trip().id)"
    >
      <!-- Header -->
      <div class="relative h-32 shrink-0 overflow-hidden"
           [style.background]="'linear-gradient(135deg, ' + color() + ' 0%, ' + color2() + ' 100%)'">

        <!-- Patrón de puntos -->
        <div class="absolute inset-0 opacity-[0.18]"
             style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 16px 16px;"></div>

        <!-- Brillo superior -->
        <div class="absolute inset-x-0 top-0 h-16"
             style="background: linear-gradient(180deg, rgba(255,255,255,0.22), transparent)"></div>

        <!-- Glow tras el icono -->
        <div class="absolute -bottom-6 left-2 w-24 h-24 rounded-full"
             style="background: radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)"></div>

        <div class="absolute bottom-3 left-4 text-4xl select-none transition-transform duration-300 group-hover:scale-110"
             style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
          {{ trip().icon }}
        </div>

        <button
          class="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150
                 opacity-0 group-hover:opacity-100"
          style="background: rgba(0,0,0,0.28); color: rgba(255,255,255,0.9)"
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

        <div class="absolute top-2.5 left-3">
          <span class="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-2xs font-bold tracking-wide"
                style="background: rgba(255,255,255,0.9); color: #1a1830">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" [style.background]="color()"></span>
            {{ statusMeta().label }}
          </span>
        </div>
      </div>

      <!-- Cuerpo -->
      <div class="flex-1 flex flex-col p-4 gap-3">
        <div>
          <h3 class="font-bold text-base leading-tight line-clamp-1 text-ink group-hover:text-primary-600 transition-colors duration-200">{{ trip().title }}</h3>
          <p class="text-xs mt-1 flex items-center gap-1 text-ink-muted">
            <svg style="width:11px;height:11px;flex-shrink:0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            {{ trip().city }}
          </p>
        </div>

        <div class="hairline"></div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="chip">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ trip().date | date:'d MMM' }}
            </span>
            <span class="chip">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span class="tabular font-bold text-ink">{{ trip().spots.length }}</span>
            </span>
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-primary-600 bg-primary-500/10
                       transition-all duration-200 group-hover:bg-primary-600 group-hover:text-white group-hover:gap-1.5">
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
  readonly color      = computed(() => this.trip().color);
  readonly color2     = computed(() => colorSecondary(this.trip().color));

  onDeleteHover(event: MouseEvent, entering: boolean): void {
    const el = event.currentTarget as HTMLElement;
    el.style.background = entering ? 'rgba(239,68,68,0.8)' : 'rgba(0,0,0,0.2)';
    el.style.color      = 'rgba(255,255,255,0.95)';
  }
}
