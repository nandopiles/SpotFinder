import { Component, ChangeDetectionStrategy, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { CreateTripDto, Coordinates } from '../../../core/models/trip.model';
import { PhotonService, PlaceResult } from '../../../core/services/photon.service';

@Component({
  selector: 'app-create-trip-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style="background: rgba(15,13,36,0.55); backdrop-filter: blur(6px)"
      (click)="onBackdropClick($event)"
    >
      <div
        class="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl shadow-modal animate-fade-up
               border border-surface-border"
        (click)="$event.stopPropagation()"
      >
        <!-- Handle (mobile) -->
        <div class="flex justify-center pt-3 sm:hidden">
          <div class="w-10 h-1 rounded-full bg-surface-border"></div>
        </div>

        <div class="px-6 pt-5 pb-6 sm:pt-6">

          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-primary shrink-0"
                   style="box-shadow: 0 4px 12px -2px rgba(79,70,229,0.5), inset 0 1px 0 rgba(255,255,255,0.2)">
                <svg style="width:18px;height:18px" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-base font-bold text-ink">Nuevo viaje</h2>
                <p class="text-xs text-ink-muted">¿A dónde vamos?</p>
              </div>
            </div>
            <button class="btn-icon" (click)="cancel.emit()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div>
              <label class="input-label">Título</label>
              <input
                formControlName="title"
                class="input"
                placeholder="Ej: Barcelona en un día"
                autocomplete="off"
              />
              @if (form.controls.title.invalid && form.controls.title.touched) {
                <p class="text-xs mt-1.5 text-red-500">El título es obligatorio</p>
              }
            </div>

            <!-- Ciudad / destino (autocomplete Photon) -->
            <div>
              <label class="input-label">Destino</label>

              @if (selectedPlace()) {
                <!-- Ciudad seleccionada -->
                <div class="flex items-center gap-3 p-3 rounded-xl"
                     style="background: rgba(99,102,241,0.07); border: 1px solid rgba(99,102,241,0.2)">
                  <div class="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
                    <span class="text-base">📍</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-ink truncate">{{ selectedPlace()!.name }}</p>
                    <p class="text-xs text-ink-muted truncate">{{ selectedPlace()!.address }}</p>
                  </div>
                  <button type="button" class="btn-icon w-8 h-8 shrink-0" (click)="clearPlace()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              } @else {
                <!-- Buscador de ciudad -->
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
                  @if (results().length) {
                    <div class="absolute z-10 left-0 right-0 mt-1.5 py-1.5 rounded-xl bg-surface
                                border border-surface-border shadow-modal max-h-64 overflow-y-auto">
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
                  } @else if (query().length >= 2 && !searching()) {
                    <div class="absolute z-10 left-0 right-0 mt-1.5 py-4 px-4 rounded-xl bg-surface
                                border border-surface-border shadow-modal text-center">
                      <p class="text-sm text-ink-muted">Sin resultados. Prueba con otro nombre.</p>
                    </div>
                  }
                </div>
                @if (form.controls.city.invalid && form.controls.city.touched) {
                  <p class="text-xs mt-1.5 text-red-500">Selecciona un destino</p>
                }
              }
            </div>

            <div>
              <label class="input-label">Fecha</label>
              <input formControlName="date" type="date" class="input" />
            </div>

            <div class="flex gap-2 pt-1">
              <button type="button" class="btn-ghost flex-1" (click)="cancel.emit()">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="form.invalid">Crear viaje</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CreateTripModalComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly photon = inject(PhotonService);

  readonly confirm = output<CreateTripDto>();
  readonly cancel = output<void>();

  // ── Estado del autocomplete de destino ──
  readonly query         = signal('');
  readonly searching     = signal(false);
  readonly selectedPlace = signal<PlaceResult | null>(null);

  private readonly query$ = new Subject<string>();

  // Tubería reactiva: texto -> Photon -> resultados. `onDone` apaga el spinner.
  private readonly results$ = this.photon.search(
    this.query$.asObservable(),
    undefined,
    () => this.searching.set(false),
  );
  readonly results = toSignal(this.results$, { initialValue: [] as PlaceResult[] });

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    city:  ['', Validators.required],
    date:  [new Date().toISOString().split('T')[0]],
  });

  // Coordenadas del destino seleccionado (centro del viaje).
  private centerCoordinates: Coordinates = { lat: 0, lng: 0 };

  onQuery(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.query.set(q);
    this.searching.set(q.trim().length >= 2);
    this.query$.next(q);
  }

  clearSearch(): void {
    this.query.set('');
    this.searching.set(false);
    this.query$.next('');
  }

  selectPlace(place: PlaceResult): void {
    this.selectedPlace.set(place);
    this.centerCoordinates = place.coordinates;
    this.form.controls.city.setValue(place.name);
    // Si el usuario no ha puesto título, proponer uno con el destino.
    if (!this.form.controls.title.value.trim()) {
      this.form.controls.title.setValue(`${place.name} en un día`);
    }
    this.query.set('');
    this.searching.set(false);
  }

  clearPlace(): void {
    this.selectedPlace.set(null);
    this.centerCoordinates = { lat: 0, lng: 0 };
    this.form.controls.city.setValue('');
  }

  onSubmit(): void {
    // Requiere un destino elegido del dropdown; no se acepta texto plano.
    if (this.form.invalid || !this.selectedPlace()) { this.form.markAllAsTouched(); return; }
    const { title, city, date } = this.form.getRawValue();
    this.confirm.emit({
      title, city, date,
      status: 'draft',
      icon: '✈️',
      color: '#6366f1',
      centerCoordinates: this.centerCoordinates,
      spots: [],
      legs: [],
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
