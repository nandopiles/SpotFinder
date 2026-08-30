import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(15,13,36,0.6); backdrop-filter: blur(6px)"
      (click)="onBackdropClick($event)"
    >
      <div
        class="relative w-full max-w-xs bg-surface rounded-2xl shadow-modal animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <div class="px-7 pt-8 pb-7">

          <!-- Icono -->
          <div class="mb-5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                 style="background: #fff1f1">
              <svg class="w-5 h-5" fill="none" stroke="#e53e3e" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
          </div>

          <!-- Texto -->
          <h3 class="text-base font-semibold mb-1 text-ink">{{ title() }}</h3>
          <p class="text-sm leading-relaxed mb-7 text-ink-muted">{{ description() }}</p>

          <!-- Acciones -->
          <div class="flex flex-col gap-2">
            <button
              class="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors duration-150"
              style="background: #e53e3e"
              (mouseenter)="onConfirmHover($event, true)"
              (mouseleave)="onConfirmHover($event, false)"
              (click)="confirm.emit()"
            >
              {{ confirmLabel() }}
            </button>
            <button
              class="w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-ink-muted"
              (mouseenter)="onCancelHover($event, true)"
              (mouseleave)="onCancelHover($event, false)"
              (click)="cancel.emit()"
            >
              {{ cancelLabel() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  readonly title        = input('Eliminar viaje');
  readonly description  = input('Esta acción no se puede deshacer.');
  readonly confirmLabel = input('Eliminar');
  readonly cancelLabel  = input('Cancelar');

  readonly confirm = output<void>();
  readonly cancel  = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }

  onConfirmHover(event: MouseEvent, entering: boolean): void {
    (event.currentTarget as HTMLElement).style.background = entering ? '#c53030' : '#e53e3e';
  }

  onCancelHover(event: MouseEvent, entering: boolean): void {
    (event.currentTarget as HTMLElement).style.background = entering ? 'var(--color-surface-subtle)' : 'transparent';
  }
}
