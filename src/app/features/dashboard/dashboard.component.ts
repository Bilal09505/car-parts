import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReportService, DashboardStats } from '../../core/services/report.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <h1 class="text-xl font-bold text-slate-800 mb-4">Dashboard</h1>

    @if (loading()) {
      <p class="text-gray-500 text-sm">Loading…</p>
    } @else if (stats(); as s) {
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div class="bg-gray-50 border border-gray-200 rounded p-4 text-center">
          <div class="text-blue-600 font-bold text-lg">{{ s.totalProducts }}</div>
          <div class="text-xs text-gray-500 mt-1">Total Products</div>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded p-4 text-center">
          <div class="text-blue-600 font-bold text-lg">{{ s.currentStockUnits }}</div>
          <div class="text-xs text-gray-500 mt-1">Current Stock (units)</div>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded p-4 text-center">
          <div class="text-blue-600 font-bold text-lg">Rs {{ s.todaysSales | number }}</div>
          <div class="text-xs text-gray-500 mt-1">Today's Sales</div>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded p-4 text-center">
          <div class="text-blue-600 font-bold text-lg">Rs {{ s.purchasesThisMonth | number }}</div>
          <div class="text-xs text-gray-500 mt-1">Purchases (MTD)</div>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded p-4 text-center">
          <div class="text-green-600 font-bold text-lg">Rs {{ s.todaysProfit | number }}</div>
          <div class="text-xs text-gray-500 mt-1">Today's Profit</div>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded p-4 text-center">
          <div class="text-red-600 font-bold text-lg">{{ s.lowStockCount }}</div>
          <div class="text-xs text-gray-500 mt-1">Low Stock Alerts</div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  async ngOnInit() {
    this.stats.set(await this.reportService.dashboardStats());
    this.loading.set(false);
  }
}
