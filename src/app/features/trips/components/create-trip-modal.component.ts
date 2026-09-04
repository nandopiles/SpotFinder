import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CreateTripDto } from '../../../core/models/trip.model';

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

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="input-label">Ciudad</label>
                <input
                  formControlName="city"
                  class="input"
                  placeholder="Barcelona"
                  autocomplete="off"
                />
                @if (form.controls.city.invalid && form.controls.city.touched) {
                  <p class="text-xs mt-1.5 text-red-500">Obligatorio</p>
                }
              </div>
              <div>
                <label class="input-label">Fecha</label>
                <input formControlName="date" type="date" class="input" />
              </div>
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
  private readonly fb = inject(FormBuilder);

  readonly confirm = output<CreateTripDto>();
  readonly cancel = output<void>();

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    city:  ['', Validators.required],
    date:  [new Date().toISOString().split('T')[0]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { title, city, date } = this.form.getRawValue();
    this.confirm.emit({
      title, city, date,
      status: 'draft',
      icon: '✈️',
      color: '#6366f1',
      centerCoordinates: { lat: 0, lng: 0 },
      spots: [],
      legs: [],
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
