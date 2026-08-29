import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Trip, TripStatus } from '../../../core/models/trip.model';

const CITY_GRADIENTS = [
  'linear-gradient(135deg, #8b5cf6, #7c3aed, #4f46e5)',
  'linear-gradient(135deg, #f43f5e, #ec4899, #9333ea)',
  'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)',
  'linear-gradient(135deg, #14b8a6, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
];

const STATUS_META: Record<TripStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  draft:     { label: 'Borrador',    dotColor: '#94a3b8', bgColor: '#f1f5f9', textColor: '#475569' },
  planned:   { label: 'Planificado', dotColor: '#6366f1', bgColor: '#eef2ff', textColor: '#4338ca' },
  completed: { label: 'Completado',  dotColor: '#10b981', bgColor: '#ecfdf5', textColor: '#065f46' },
};

function cityGradient(city: string): string {
  const hash = city.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CITY_GRADIENTS[hash % CITY_GRADIENTS.length];
}

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="card-interactive group overflow-hidden flex flex-col"
      (click)="select.emit(trip().id)"
    >
      <!-- ── Header con gradiente ── -->
      <div class="relative h-32 overflow-hidden shrink-0" [style.background]="gradient()">

        <!-- Letras de fondo -->
        <div class="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span class="text-[5rem] font-black select-none tracking-tighter leading-none"
                style="color: rgba(255,255,255,0.08)">
            {{ trip().city.slice(0, 2).toUpperCase() }}
          </span>
        </div>

        <!-- Badge de estado -->
        <div class="absolute top-3 left-3">
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style="background: rgba(255,255,255,0.18); color: white; border: 1px solid rgba(255,255,255,0.25); backdrop-filter: blur(8px)"
          >
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              [style.background]="statusMeta().dotColor"
            ></span>
            {{ statusMeta().label }}
          </span>
        </div>

        <!-- Botón eliminar -->
        <div class="absolute top-3 right-3">
          <button
            class="w-7 h-7 rounded-lg flex items-center justify-center
                   opacity-0 group-hover:opacity-100 transition-all duration-200"
            style="background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.7)"
            (mouseenter)="onDeleteHover($event, true)"
            (mouseleave)="onDeleteHover($event, false)"
            (click)="$event.stopPropagation(); delete.emit(trip().id)"
            title="Eliminar viaje"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <!-- Fecha abajo -->
        <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <p class="text-xs font-semibold uppercase tracking-widest"
             style="color: rgba(255,255,255,0.75)">
            {{ trip().date | date:'EEE, d MMM' : '' : 'es' }}
          </p>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="flex-1 p-4 flex flex-col gap-3 bg-white">

        <!-- Título y ciudad -->
        <div>
          <h3 class="font-bold text-base leading-snug line-clamp-1 transition-colors duration-150"
              style="color: #1a1830">
            {{ trip().title }}
          </h3>
          <p class="text-xs mt-0.5 flex items-center gap-1" style="color: #8b89a8">
            <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clip-rule="evenodd"/>
            </svg>
            {{ trip().city }}
          </p>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-3 pt-3 mt-auto"
             style="border-top: 1px solid #e5e4f0">

          <!-- Paradas -->
          <div class="flex items-center gap-1.5 text-xs" style="color: #8b89a8">
            <div class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                 style="background: #eef2ff">
              <svg class="w-3 h-3" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <span>
              <strong style="color: #1a1830; font-weight: 600">{{ trip().spots.length }}</strong>
              parada{{ trip().spots.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Tramos (si hay) -->
          @if (trip().legs.length) {
            <div class="flex items-center gap-1.5 text-xs" style="color: #8b89a8">
              <div class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                   style="background: #fdf4ff">
                <svg class="w-3 h-3" fill="none" stroke="#c026d3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
              <span>
                <strong style="color: #1a1830; font-weight: 600">{{ trip().legs.length }}</strong>
                tramo{{ trip().legs.length !== 1 ? 's' : '' }}
              </span>
            </div>
          }

          <!-- CTA -->
          <div class="ml-auto flex items-center gap-1 text-xs font-semibold"
               style="color: #4f46e5">
            Ver
            <svg class="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
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
  readonly gradient   = computed(() => cityGradient(this.trip().city));

  onDeleteHover(event: MouseEvent, entering: boolean): void {
    const btn = event.currentTarget as HTMLElement;
    btn.style.background = entering
      ? 'rgba(239, 68, 68, 0.75)'
      : 'rgba(255,255,255,0.12)';
    btn.style.color = 'white';
  }
}
