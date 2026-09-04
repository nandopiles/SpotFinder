import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-up">
      <!-- Illustration -->
      <div class="relative mb-8">
        <!-- Halo -->
        <div class="absolute inset-0 -m-6 rounded-full bg-primary-500/10 blur-2xl"></div>
        <!-- Anillos decorativos -->
        <div class="absolute inset-0 -m-3 rounded-full border border-dashed border-primary-500/25"></div>
        <div class="relative w-24 h-24 rounded-[1.75rem] bg-gradient-to-br from-primary-100 to-accent-100
                    dark:from-primary-500/20 dark:to-accent-500/20
                    flex items-center justify-center border border-white/50 dark:border-white/5"
             style="box-shadow: var(--shadow-md)">
          <span class="text-4xl">{{ emoji() }}</span>
        </div>
        <div class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-primary
                    flex items-center justify-center"
             style="box-shadow: 0 4px 10px -2px rgba(79,70,229,0.5)">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
      </div>

      <h3 class="text-xl font-bold text-ink mb-2">{{ title() }}</h3>
      <p class="text-sm text-ink-muted max-w-xs leading-relaxed mb-8">{{ description() }}</p>

      @if (actionLabel()) {
        <button class="btn-primary-lg" (click)="action.emit()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly emoji = input('📭');
  readonly title = input('Sin resultados');
  readonly description = input('');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
