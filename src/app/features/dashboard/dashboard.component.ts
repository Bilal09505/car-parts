import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReportService, DashboardStats } from '../../core/services/report.service';
import { Product } from '../../core/models';

interface TrendPoint {
  label: string;
  amount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <h1 class="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
    <p class="text-sm text-gray-500 mb-6">Live overview of stock, sales, and purchases</p>

    @if (loading()) {
      <p class="text-gray-500 text-sm">Loading…</p>
    } @else {
      @if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="text-xs text-gray-500 mb-1">Total Products</div>
            <div class="text-blue-600 font-bold text-2xl">{{ s.totalProducts }}</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="text-xs text-gray-500 mb-1">Current Stock (units)</div>
            <div class="text-blue-600 font-bold text-2xl">{{ s.currentStockUnits }}</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="text-xs text-gray-500 mb-1">Today's Sales</div>
            <div class="text-blue-600 font-bold text-2xl">Rs {{ s.todaysSales | number }}</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="text-xs text-gray-500 mb-1">Purchases (MTD)</div>
            <div class="text-blue-600 font-bold text-2xl">Rs {{ s.purchasesThisMonth | number }}</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="text-xs text-gray-500 mb-1">Today's Profit</div>
            <div class="text-green-600 font-bold text-2xl">Rs {{ s.todaysProfit | number }}</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div class="text-xs text-gray-500 mb-1">Low Stock Alerts</div>
            <div class="text-red-600 font-bold text-2xl">{{ s.lowStockCount }}</div>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Sales — Last 7 Days</h2>
          @if (trend().length > 0) {
            <div class="flex items-end justify-between gap-2 h-40">
              @for (point of trend(); track point.label) {
                <div class="flex-1 flex flex-col items-center justify-end h-full">
                  <div class="text-xs text-gray-500 mb-1">{{ point.amount | number }}</div>
                  <div class="w-full bg-orange-500 rounded-t" [style.height.%]="barHeight(point.amount)"></div>
                  <div class="text-xs text-gray-400 mt-1">{{ point.label }}</div>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-gray-400">No sales data yet.</p>
          }
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Low Stock Products</h2>
          @if (lowStock().length > 0) {
            <div class="space-y-2 max-h-64 overflow-y-auto">
              @for (row of lowStock(); track row.product.id) {
                <div class="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <div>
                    <div class="font-medium text-slate-700">{{ row.product.name }}</div>
                    <div class="text-xs text-gray-400">{{ row.product.category }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-red-600 font-semibold">{{ row.totalRemaining }}</div>
                    <div class="text-xs text-gray-400">reorder @ {{ row.product.reorderLevel }}</div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-gray-400">All stock levels healthy.</p>
          }
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private reportService = inject(ReportService);

  stats = signal<DashboardStats | null>(null);
  lowStock = signal<{ product: Product; totalRemaining: number }[]>([]);
  trend = signal<TrendPoint[]>([]);
  loading = signal(true);

  maxTrendAmount = computed(() => Math.max(...this.trend().map((t) => t.amount), 1));

  barHeight(amount: number): number {
    const max = this.maxTrendAmount();
    return max > 0 ? Math.max((amount / max) * 100, 2) : 2;
  }

  async ngOnInit() {
    const [stats, lowStock, trend] = await Promise.all([
      this.reportService.dashboardStats(),
      this.reportService.lowStockReport(),
      this.reportService.salesTrend7Days(),
    ]);
    this.stats.set(stats);
    this.lowStock.set(lowStock);
    this.trend.set(trend);
    this.loading.set(false);
  }
}