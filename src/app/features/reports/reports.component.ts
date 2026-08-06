import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { Product } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="text-xl font-bold text-slate-800 mb-4">Reports</h1>

    <div class="flex gap-2 mb-4">
      <button (click)="tab.set('stock')" [class.bg-slate-900]="tab() === 'stock'" [class.text-white]="tab() === 'stock'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Stock Report</button>
      <button (click)="tab.set('low')" [class.bg-slate-900]="tab() === 'low'" [class.text-white]="tab() === 'low'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Low Stock Report</button>
    </div>

    @if (tab() === 'stock') {
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-white">
            <tr><th class="px-3 py-2 text-left">Product</th><th class="px-3 py-2 text-right">Remaining</th><th class="px-3 py-2 text-right">Stock Value</th></tr>
          </thead>
          <tbody>
            @for (row of stockRows(); track row.product.id) {
              <tr class="border-t border-gray-200">
                <td class="px-3 py-2">{{ row.product.name }}</td>
                <td class="px-3 py-2 text-right">{{ row.totalRemaining }}</td>
                <td class="px-3 py-2 text-right">Rs {{ row.stockValue | number }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-white">
            <tr><th class="px-3 py-2 text-left">Product</th><th class="px-3 py-2 text-right">Remaining</th><th class="px-3 py-2 text-right">Reorder Level</th></tr>
          </thead>
          <tbody>
            @for (row of lowStockRows(); track row.product.id) {
              <tr class="border-t border-gray-200 bg-red-50">
                <td class="px-3 py-2">{{ row.product.name }}</td>
                <td class="px-3 py-2 text-right font-medium text-red-700">{{ row.totalRemaining }}</td>
                <td class="px-3 py-2 text-right">{{ row.product.reorderLevel }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  tab = signal<'stock' | 'low'>('stock');
  stockRows = signal<{ product: Product; totalRemaining: number; stockValue: number }[]>([]);
  lowStockRows = signal<{ product: Product; totalRemaining: number }[]>([]);

  async ngOnInit() {
    this.stockRows.set(await this.reportService.stockReport());
    this.lowStockRows.set(await this.reportService.lowStockReport());
  }
}
