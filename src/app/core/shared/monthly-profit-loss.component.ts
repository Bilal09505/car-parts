import { Component, OnInit, computed, inject, input, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReportService } from '../services/report.service';
import { MonthlyProfitLoss } from '../services/monthly-profit-loss';

@Component({
  selector: 'app-monthly-profit-loss',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6" aria-label="Monthly profit and loss">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-base font-semibold text-slate-800">Monthly Profit &amp; Loss</h2>
        <label class="flex items-center gap-2 text-sm text-gray-600">
          Month
          <input type="month" class="border border-gray-300 rounded px-3 py-1.5"
            [value]="selectedMonth()" (change)="changeMonth($any($event.target).value)" />
        </label>
      </div>
      <p class="text-xs text-gray-500 mb-4">Gross profit/loss = sales minus cost of goods sold. Operating expenses are not included.</p>
      @if (loading()) {
        <p class="text-sm text-gray-500" role="status">Loading monthly report…</p>
      } @else if (error()) {
        <div class="text-sm text-red-700" role="alert">
          {{ error() }}
          <button type="button" class="underline ml-2" (click)="loadYear()">Retry</button>
        </div>
      } @else {
        @if (selectedRow(); as row) {
          <h3 class="text-sm font-medium text-gray-700 mb-3">{{ row.label }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-xs text-gray-500 mb-1">Sales</div>
              <div class="text-blue-600 font-bold text-xl">Rs {{ row.sales | number:'1.0-2' }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-xs text-gray-500 mb-1">Cost of Goods Sold</div>
              <div class="text-slate-700 font-bold text-xl">Rs {{ row.costOfGoodsSold | number:'1.0-2' }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-xs text-gray-500 mb-1">Gross {{ row.profit < 0 ? 'Loss' : 'Profit' }}</div>
              <div class="font-bold text-xl" [class.text-green-700]="row.profit >= 0" [class.text-red-700]="row.profit < 0">
                Rs {{ row.profit | number:'1.0-2' }}
              </div>
            </div>
          </div>
          @if (row.saleCount === 0) {
            <p class="text-sm text-gray-500 mt-3">No sales recorded for this month.</p>
          }
        }
        @if (showBreakdown()) {
          <div class="overflow-x-auto border border-gray-200 rounded mt-5">
            <table class="responsive-table w-full text-sm">
              <caption class="text-left text-sm font-semibold text-gray-700 p-3">Monthly breakdown — {{ selectedYear() }}</caption>
              <thead class="bg-slate-900 text-white">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left">Month</th>
                  <th scope="col" class="px-3 py-2 text-right">Sales</th>
                  <th scope="col" class="px-3 py-2 text-right">Cost of Goods Sold</th>
                  <th scope="col" class="px-3 py-2 text-right">Gross Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.month) {
                  <tr class="border-t border-gray-200" [class.bg-blue-50]="row.month === selectedRow()?.month">
                    <th data-label="Month" scope="row" class="px-3 py-2 text-left font-normal whitespace-nowrap"><div class="cell-value">{{ row.label }} @if ($any(row)._sync) { <span class="pending-badge">Saved on device</span> }</div></th>
                    <td data-label="Sales" class="px-3 py-2 text-right whitespace-nowrap"><div class="cell-value">Rs {{ row.sales | number:'1.0-2' }}</div></td>
                    <td data-label="Cost of Goods Sold" class="px-3 py-2 text-right whitespace-nowrap"><div class="cell-value">Rs {{ row.costOfGoodsSold | number:'1.0-2' }}</div></td>
                    <td data-label="Gross Profit / Loss" class="px-3 py-2 text-right font-medium whitespace-nowrap" [class.text-green-700]="row.profit >= 0" [class.text-red-700]="row.profit < 0"><div class="cell-value">Rs {{ row.profit | number:'1.0-2' }}</div></td>
                  </tr>
                }
              </tbody>
              <tfoot class="border-t-2 border-slate-300 bg-gray-50 font-semibold">
                <tr>
                  <th data-label="Month" scope="row" class="px-3 py-2 text-left"><div class="cell-value">Year total</div></th>
                  <td data-label="Sales" class="px-3 py-2 text-right whitespace-nowrap"><div class="cell-value">Rs {{ totals().sales | number:'1.0-2' }}</div></td>
                  <td data-label="Cost of Goods Sold" class="px-3 py-2 text-right whitespace-nowrap"><div class="cell-value">Rs {{ totals().costOfGoodsSold | number:'1.0-2' }}</div></td>
                  <td data-label="Gross Profit / Loss" class="px-3 py-2 text-right whitespace-nowrap" [class.text-green-700]="totals().profit >= 0" [class.text-red-700]="totals().profit < 0"><div class="cell-value">Rs {{ totals().profit | number:'1.0-2' }}</div></td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      }
    </section>
  `,
})
export class MonthlyProfitLossComponent implements OnInit {
  private reportService = inject(ReportService);
  private requestId = 0;
  private loadedYear: number | null = null;
  private today = new Date();

  constructor() {
    let firstRun = true;
    effect(onCleanup => {
      this.reportService.revision();
      if (firstRun) { firstRun = false; return; }
      const timer = setTimeout(() => { void this.loadYear(); }, 100);
      onCleanup(() => clearTimeout(timer));
    });
  }

  showBreakdown = input(false);
  selectedMonth = signal(`${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}`);
  selectedYear = computed(() => Number(this.selectedMonth().split('-')[0]));
  rows = signal<MonthlyProfitLoss[]>([]);
  loading = signal(true);
  error = signal('');
  selectedRow = computed(() => this.rows().find(row => row.month === Number(this.selectedMonth().split('-')[1]) - 1));
  totals = computed(() => this.rows().reduce((total, row) => ({
    sales: total.sales + row.sales,
    costOfGoodsSold: total.costOfGoodsSold + row.costOfGoodsSold,
    profit: total.profit + row.profit,
  }), { sales: 0, costOfGoodsSold: 0, profit: 0 }));

  ngOnInit() {
    void this.loadYear();
  }

  changeMonth(value: string) {
    if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)) return;
    this.selectedMonth.set(value);
    if (this.loadedYear !== this.selectedYear() || this.loading() || this.error()) {
      void this.loadYear();
    }
  }

  async loadYear() {
    const requestId = ++this.requestId;
    const year = this.selectedYear();
    this.loading.set(true);
    this.error.set('');
    try {
      const rows = await this.reportService.monthlyProfitLoss(year);
      if (requestId !== this.requestId) return;
      this.rows.set(rows);
      this.loadedYear = year;
    } catch (error: any) {
      if (requestId === this.requestId) this.error.set(error.message ?? 'Unable to load the monthly report. Please try again.');
    } finally {
      if (requestId === this.requestId) this.loading.set(false);
    }
  }
}
