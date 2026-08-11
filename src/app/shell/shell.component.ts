import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem { label: string; icon: string; path: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex h-screen bg-gray-50">

      <!-- Desktop sidebar -->
      <aside class="hidden md:flex md:flex-col w-60 bg-slate-900 text-white shrink-0">
        <div class="px-5 py-5 font-bold text-lg border-b border-slate-700">
          Mughal Auto
        </div>
        <nav class="flex-1 py-3">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-slate-800 border-orange-500"
              class="flex items-center gap-3 px-5 py-3 border-l-4 border-transparent text-sm hover:bg-slate-800 transition-colors">
              <span>{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </aside>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <header class="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
          <span class="font-bold">Car Parts Inventory</span>
        </header>

        <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile bottom nav: most-used 5 of 9 modules; rest reachable via sidebar drawer on wider mobile views -->
      <nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-2 z-10">
        @for (item of mobileNavItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="text-orange-600"
            class="flex flex-col items-center text-xs text-gray-500 px-2">
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </div>
  `,
})
export class ShellComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '⬛', path: '/dashboard' },
    { label: 'Products', icon: '▣', path: '/products' },
    { label: 'Purchase', icon: '⬒', path: '/purchase' },
    { label: 'Sales', icon: '◆', path: '/sales' },
    { label: 'Lots', icon: '▤', path: '/lots' },
    { label: 'Suppliers', icon: '▧', path: '/suppliers' },
    { label: 'Customers', icon: '▨', path: '/customers' },
    { label: 'Reports', icon: '▥', path: '/reports' },
  ];

  mobileNavItems: NavItem[] = [
    { label: 'Dashboard', icon: '⬛', path: '/dashboard' },
    { label: 'Sales', icon: '◆', path: '/sales' },
    { label: 'Purchase', icon: '⬒', path: '/purchase' },
    { label: 'Lots', icon: '▤', path: '/lots' },
    { label: 'Reports', icon: '▥', path: '/reports' },
  ];
}
