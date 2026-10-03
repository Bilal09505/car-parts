import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="paths[name()] || paths['box']" /></svg>`,
  host: { class: 'app-icon' },
})
export class IconComponent {
  name = input('box');
  paths: Record<string, string> = {
    menu: 'M4 6h16M4 12h16M4 18h16', close: 'm6 6 12 12M6 18 18 6',
    dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    box: 'm3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 5 9-5M12 12v9M7 5l10 5',
    purchase: 'M4 4h3l2 12h10l2-9H8M10 20h.01M18 20h.01M14 2v8m-3-3 3 3 3-3',
    sales: 'M5 3h14v18l-3-2-4 2-4-2-3 2zM8 7h8M8 11h8M8 15h4',
    layers: 'm3 7 9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4',
    truck: 'M3 5h12v12H3zM15 9h4l3 4v4h-7M6 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4M18 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M17 4a4 4 0 0 1 0 7M22 21v-2a4 4 0 0 0-3-4',
    chart: 'M3 3v18h18M7 16v-5M12 16V7M17 16V4',
    image: 'M3 3h18v18H3zM3 16l5-5 4 4 3-3 6 6M15 7h.01',
    logout: 'M9 4H4v16h5M9 12h12m-4-4 4 4-4 4',
    sync: 'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3',
    offline: 'm3 3 18 18M2 8a16 16 0 0 1 4-2M10 4a16 16 0 0 1 12 4M5 12a10 10 0 0 1 5-2M15 10a10 10 0 0 1 4 2M8 16a6 6 0 0 1 8 0M12 20h.01',
    check: 'm5 12 4 4L19 6',
  };
}
