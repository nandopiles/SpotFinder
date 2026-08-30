import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal<boolean>(this.getInitial());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  toggle(originRect?: DOMRect): void {
    const next = !this.isDark();

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.isDark.set(next);
      return;
    }

    const x = originRect ? originRect.left + originRect.width / 2 : window.innerWidth / 2;
    const y = originRect ? originRect.top  + originRect.height / 2 : window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => { this.isDark.set(next); });

    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];
      document.documentElement.animate(
        { clipPath },
        { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      );
    });
  }

  private getInitial(): boolean {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
