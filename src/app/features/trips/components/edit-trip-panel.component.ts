import { Component, ChangeDetectionStrategy, input, output, inject, computed, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { Trip, TripStatus, UpdateTripDto, Coordinates } from '../../../core/models/trip.model';
import { PhotonService, PlaceResult } from '../../../core/services/photon.service';
import { UiStateService } from '../../../core/services/ui-state.service';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#14b8a6', '#3b82f6',
  '#10b981', '#64748b',
];

const PRESET_ICONS = [
  '✈️', '🗺️', '🏙️', '🌍', '📍', '🧭',
  '🏖️', '🏔️', '🏛️', '🌿', '🎭', '🍽️',
  '🚂', '⛵', '🏕️', '🎒',
];

const STATUS_OPTIONS: { value: TripStatus; label: string; description: string; emoji: string; color: string; bg: string }[] = [
  { value: 'draft',     label: 'Borrador',    description: 'Todavía planificando',         emoji: '🗒️', color: '#8a88aa', bg: 'var(--color-surface-subtle)' },
  { value: 'planned',   label: 'Planificado', description: 'Fechas y paradas confirmadas', emoji: '📅', color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
  { value: 'completed', label: 'Completado',  description: 'Viaje realizado',              emoji: '✅', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
];

function colorSecondary(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.4).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

@Component({
  selector: 'app-edit-trip-panel',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
      [style.opacity]="closing() ? '0' : '1'"
      (click)="cancel.emit()"
    ></div>

    <!-- Panel -->
    <aside class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col bg-surface shadow-modal
                  border-l border-surface-border"
           [class.animate-slide-in-right]="!closing()"
           [class.animate-slide-out-right]="closing()">

      <!-- Header con gradiente dinámico -->
      <div class="relative h-32 shrink-0 overflow-hidden"
           [style.background]="'linear-gradient(135deg, ' + previewColor() + ' 0%, ' + previewColor2() + ' 100%)'">
        <div class="absolute inset-0 opacity-20"
             style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 18px 18px;"></div>
        <div class="absolute inset-0 flex flex-col justify-end p-5">
          <p class="text-white/70 text-xs font-medium mb-1">Editando viaje</p>
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ formValue().icon }}</span>
            <h2 class="text-white font-bold text-lg leading-tight truncate">
              {{ formValue().title || 'Sin título' }}
            </h2>
          </div>
          <p class="text-white/80 text-sm mt-0.5 truncate">{{ formValue().city || 'Ciudad' }}</p>
        </div>
        <button class="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center
                       transition-colors duration-150"
                style="background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.9)"
                (click)="cancel.emit()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()"
            class="flex-1 overflow-y-auto flex flex-col">
        <div class="flex-1 p-5 space-y-5">

          <!-- Título -->
          <div>
            <label class="input-label">Título del viaje</label>
            <input formControlName="title" class="input" placeholder="Ej: Barcelona en un día" autocomplete="off"/>
            @if (form.controls.title.invalid && form.controls.title.touched) {
              <p class="text-xs mt-1.5 text-red-400">El título es obligatorio</p>
            }
          </div>

          <!-- Ciudad (autocomplete Photon) -->
          <div>
            <label class="input-label">Ciudad / destino</label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                @if (searching()) {
                  <svg class="w-4 h-4 text-brand animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                } @else {
                  <svg class="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                }
              </div>
              <input
                class="input pl-10 pr-9"
                placeholder="Barcelona, Roma, Tokio..."
                autocomplete="off"
                [value]="query()"
                (input)="onQuery($event)"
              />
              @if (query()) {
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                         bg-surface-border hover:bg-surface-border-strong
                         flex items-center justify-center transition-colors"
                  (click)="clearSearch()">
                  <svg class="w-3 h-3 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }

              <!-- Dropdown resultados -->
              @if (touched() && results().length) {
                <div class="absolute z-10 left-0 right-0 mt-1.5 py-1.5 rounded-xl bg-surface
                            border border-surface-border shadow-modal max-h-56 overflow-y-auto">
                  @for (place of results(); track place.name + place.address) {
                    <button
                      type="button"
                      class="flex items-center gap-3 w-full px-3 py-2.5 text-left
                             hover:bg-surface-subtle active:bg-surface-border
                             transition-colors duration-100 group"
                      (click)="selectPlace(place)"
                    >
                      <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center
                                  bg-surface-subtle group-hover:bg-surface border border-surface-border">
                        <span class="text-sm">📍</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-ink truncate">{{ place.name }}</p>
                        <p class="text-xs text-ink-muted truncate mt-0.5">{{ place.address }}</p>
                      </div>
                    </button>
                  }
                </div>
              } @else if (touched() && query().length >= 2 && !searching()) {
                <div class="absolute z-10 left-0 right-0 mt-1.5 py-4 px-4 rounded-xl bg-surface
                            border border-surface-border shadow-modal text-center">
                  <p class="text-sm text-ink-muted">Sin resultados. Prueba con otro nombre.</p>
                </div>
              }
            </div>
            @if (touched() && !form.controls.city.value) {
              <p class="text-xs mt-1.5 text-red-400">Selecciona un destino de la lista</p>
            }
          </div>

          <!-- Fecha -->
          <div>
            <label class="input-label">Fecha</label>
            <input formControlName="date" type="date" class="input"/>
          </div>

          <!-- Color -->
          <div>
            <label class="input-label">Color</label>
            <div class="flex flex-wrap gap-2 mt-1">
              @for (c of presetColors; track c) {
                <button
                  type="button"
                  class="w-7 h-7 rounded-lg transition-all duration-150 shrink-0"
                  [style.background]="c"
                  [style.outline]="formValue().color === c ? '2px solid ' + c : 'none'"
                  [style.outlineOffset]="'2px'"
                  [style.transform]="formValue().color === c ? 'scale(1.2)' : 'scale(1)'"
                  (click)="form.controls.color.setValue(c)"
                ></button>
              }
            </div>
          </div>

          <!-- Icono -->
          <div>
            <label class="input-label">Icono</label>
            <div class="flex flex-wrap gap-2 mt-1">
              @for (ic of presetIcons; track ic) {
                <button
                  type="button"
                  class="w-9 h-9 rounded-xl text-lg flex items-center justify-center
                         transition-all duration-150 border-2"
                  [style.borderColor]="formValue().icon === ic ? previewColor() : 'var(--color-surface-border)'"
                  [style.background]="formValue().icon === ic ? previewColor() + '20' : 'var(--color-surface-subtle)'"
                  [style.transform]="formValue().icon === ic ? 'scale(1.15)' : 'scale(1)'"
                  (click)="form.controls.icon.setValue(ic)"
                >{{ ic }}</button>
              }
            </div>
          </div>

          <!-- Estado -->
          <div>
            <label class="input-label">Estado del viaje</label>
            <div class="flex flex-col gap-2 mt-1">
              @for (opt of statusOptions; track opt.value) {
                <button
                  type="button"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left
                         transition-all duration-150 w-full"
                  [style.borderColor]="formValue().status === opt.value ? opt.color : 'var(--color-surface-border)'"
                  [style.background]="formValue().status === opt.value ? opt.bg : 'var(--color-surface-subtle)'"
                  (click)="form.controls.status.setValue(opt.value)"
                >
                  <span class="text-xl shrink-0">{{ opt.emoji }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-ink">{{ opt.label }}</p>
                    <p class="text-xs text-ink-muted">{{ opt.description }}</p>
                  </div>
                  @if (formValue().status === opt.value) {
                    <svg class="w-4 h-4 shrink-0" [style.color]="opt.color" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>

          <p class="text-2xs text-ink-faint text-center">
            Última actualización: {{ trip().updatedAt | date:'d MMM yyyy, HH:mm' }}
          </p>
        </div>

        <!-- Footer -->
        <div class="shrink-0 p-5 border-t border-surface-border flex gap-3">
          <button type="button" class="btn-ghost flex-1" [disabled]="saving()" (click)="cancel.emit()">Cancelar</button>
          <button type="submit" class="btn-primary flex-1" [disabled]="form.invalid || !isDirty() || saving()">
            @if (saving()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Guardando...
            } @else {
              Guardar cambios
            }
          </button>
        </div>
      </form>
    </aside>
  `,
})
export class EditTripPanelComponent implements OnInit {
  readonly trip    = input.required<Trip>();
  readonly closing = input(false);
  readonly confirm = output<UpdateTripDto>();
  readonly cancel  = output<void>();

  private readonly fb     = inject(FormBuilder);
  private readonly ui     = inject(UiStateService);
  private readonly photon = inject(PhotonService);

  readonly saving = this.ui.editPanelSaving;

  readonly presetColors  = PRESET_COLORS;
  readonly presetIcons   = PRESET_ICONS;
  readonly statusOptions = STATUS_OPTIONS;

  // ── Estado del autocomplete de ciudad ──
  readonly query     = signal('');
  readonly searching = signal(false);
  /** El dropdown solo se muestra tras interactuar con el buscador, no al precargar. */
  readonly touched   = signal(false);
  private readonly query$ = new Subject<string>();

  private readonly results$ = this.photon.search(
    this.query$.asObservable(),
    undefined,
    () => this.searching.set(false),
  );
  readonly results = toSignal(this.results$, { initialValue: [] as PlaceResult[] });

  /** Coordenadas del destino. Se actualiza solo si el usuario elige uno nuevo. */
  private centerCoordinates: Coordinates = { lat: 0, lng: 0 };
  private readonly coordinatesChanged = signal(false);

  readonly form = this.fb.nonNullable.group({
    title:  ['', Validators.required],
    city:   ['', Validators.required],
    date:   [''],
    status: ['draft' as TripStatus],
    color:  ['#6366f1'],
    icon:   ['✈️'],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly previewColor  = computed(() => this.formValue().color  ?? '#6366f1');
  readonly previewColor2 = computed(() => colorSecondary(this.formValue().color ?? '#6366f1'));

  readonly isDirty = computed(() => {
    const t = this.trip();
    const v = this.formValue();
    return v.title !== t.title || v.city !== t.city || v.date !== t.date
        || v.status !== t.status || v.color !== t.color || v.icon !== t.icon
        || this.coordinatesChanged();
  });

  ngOnInit(): void {
    const t = this.trip();
    this.form.setValue({
      title:  t.title,
      city:   t.city,
      date:   t.date,
      status: t.status,
      color:  t.color ?? '#6366f1',
      icon:   t.icon  ?? '✈️',
    });
    // Precargar el buscador y las coordenadas actuales del viaje.
    this.query.set(t.city);
    this.centerCoordinates = t.centerCoordinates;
  }

  onQuery(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.touched.set(true);
    this.query.set(q);
    this.searching.set(q.trim().length >= 2);
    this.query$.next(q);
    // Escribir a mano invalida la selección: solo un lugar elegido del
    // dropdown rellena `city`. Así el texto plano no se guarda.
    this.form.controls.city.setValue('');
    this.coordinatesChanged.set(false);
  }

  clearSearch(): void {
    this.touched.set(true);
    this.query.set('');
    this.searching.set(false);
    this.query$.next('');
    this.form.controls.city.setValue('');
  }

  selectPlace(place: PlaceResult): void {
    this.centerCoordinates = place.coordinates;
    this.coordinatesChanged.set(true);
    this.form.controls.city.setValue(place.name);
    this.query.set(place.name);
    this.searching.set(false);
    this.touched.set(false);
    this.query$.next('');
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const dto: UpdateTripDto = this.form.getRawValue();
    // Solo enviar coordenadas si el usuario seleccionó un nuevo destino.
    if (this.coordinatesChanged()) dto.centerCoordinates = this.centerCoordinates;
    this.confirm.emit(dto);
  }
}
