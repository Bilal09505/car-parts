import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent) },
      { path: 'purchase', loadComponent: () => import('./features/purchase/purchase.component').then(m => m.PurchaseComponent) },
      { path: 'sales', loadComponent: () => import('./features/sales/sales.component').then(m => m.SalesComponent) },
      { path: 'lots', loadComponent: () => import('./features/lots/lots.component').then(m => m.LotsComponent) },
      { path: 'suppliers', loadComponent: () => import('./features/suppliers/suppliers.component').then(m => m.SuppliersComponent) },
      { path: 'customers', loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
