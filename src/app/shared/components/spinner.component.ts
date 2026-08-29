import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    @if (fullPage()) {

      <!-- Full-page loader -->
      <div class="flex flex-col items-center justify-center min-h-[50vh] gap-6 animate-fade-in">

        <!-- Orbital rings -->
        <div class="relative w-20 h-20">

          <!-- Glow backdrop -->
          <div class="absolute inset-2 rounded-full bg-gradient-primary opacity-20 blur-md animate-pulse-soft"></div>

          <!-- Outer ring — slow clockwise -->
          <svg class="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 80 80" fill="none">
            <circle
              cx="40" cy="40" r="36"
              stroke="url(#ring-outer)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="56 170"
            />
            <defs>
              <linearGradient id="ring-outer" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#4f46e5"/>
                <stop offset="100%" stop-color="#c026d3" stop-opacity="0"/>
              </linearGradient>
            </defs>
          </svg>

          <!-- Inner ring — faster counter-clockwise -->
          <svg class="absolute inset-0 w-full h-full animate-spin-reverse" viewBox="0 0 80 80" fill="none">
            <circle
              cx="40" cy="40" r="24"
              stroke="url(#ring-inner)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="30 120"
            />
            <defs>
              <linearGradient id="ring-inner" x1="80" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#a855f7"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
              </linearGradient>
            </defs>
          </svg>

          <!-- Orbiting dot -->
          <div class="absolute inset-0 flex items-center justify-center animate-orbit"
               style="transform-origin: center center;">
            <div class="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary-400 to-accent-500
                        shadow-[0_0_8px_2px_rgba(99,102,241,0.6)]"></div>
          </div>

          <!-- Center logo mark -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Label + dots -->
        <div class="flex flex-col items-center gap-2">
          <p class="text-sm font-semibold text-ink-secondary tracking-wide">Cargando</p>
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-dot-bounce"
                 style="animation-delay: 0ms"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-accent-500 animate-dot-bounce"
                 style="animation-delay: 160ms"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-primary-400 animate-dot-bounce"
                 style="animation-delay: 320ms"></div>
          </div>
        </div>

      </div>

    } @else {

      <!-- Inline loader — tres dots -->
      <div class="flex items-center justify-center gap-1.5 p-3">
        <div class="rounded-full bg-primary-500 animate-dot-bounce"
             [class]="dotSize()"
             style="animation-delay: 0ms"></div>
        <div class="rounded-full bg-accent-500 animate-dot-bounce"
             [class]="dotSize()"
             style="animation-delay: 160ms"></div>
        <div class="rounded-full bg-primary-400 animate-dot-bounce"
             [class]="dotSize()"
             style="animation-delay: 320ms"></div>
      </div>

    }
  `,
})
export class SpinnerComponent {
  readonly size     = input<'sm' | 'md' | 'lg'>('md');
  readonly fullPage = input(false);

  readonly dotSize = () => ({ sm: 'w-1 h-1', md: 'w-1.5 h-1.5', lg: 'w-2 h-2' }[this.size()]);
}
