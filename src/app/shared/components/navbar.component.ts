import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-50 glass border-b border-surface-border/60 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        <!-- Logo -->
        <a routerLink="/trips" class="flex items-center gap-2.5 group shrink-0">
          <div class="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center
                      shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <span class="font-bold text-base text-ink tracking-tight">
            Spot<span class="text-primary-600">Finder</span>
          </span>
        </a>

<!-- Right slot -->
        <div class="flex items-center gap-2 shrink-0">

          <!-- Theme toggle -->
          <button
            #toggleBtn
            class="btn-icon relative overflow-hidden"
            [title]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            (click)="onToggle(toggleBtn)"
          >
            <!-- Sol -->
            <svg
              class="w-4 h-4 absolute transition-all duration-300"
              [style.opacity]="theme.isDark() ? '1' : '0'"
              [style.transform]="theme.isDark() ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)'"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
            <!-- Luna -->
            <svg
              class="w-4 h-4 absolute transition-all duration-300"
              [style.opacity]="theme.isDark() ? '0' : '1'"
              [style.transform]="theme.isDark() ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)'"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>

          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500
                      flex items-center justify-center text-white text-xs font-bold shadow-sm">
            U
          </div>
        </div>

      </div>
    </header>
  `,
})
export class NavbarComponent {
  protected readonly theme = inject(ThemeService);

  onToggle(btn: HTMLButtonElement): void {
    this.theme.toggle(btn.getBoundingClientRect());
  }
}
