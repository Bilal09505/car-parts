import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { LotService } from '../../core/services/lot.service';
import { Product, Lot } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="text-xl font-bold text-slate-800 mb-4">Reports</h1>

    <div class="flex gap-2 mb-4 flex-wrap">
      <button (click)="tab.set('stock')" [class.bg-slate-900]="tab() === 'stock'" [class.text-white]="tab() === 'stock'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Stock Report</button>
      <button (click)="tab.set('low')" [class.bg-slate-900]="tab() === 'low'" [class.text-white]="tab() === 'low'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Low Stock Report</button>
      <button (click)="tab.set('lot')" [class.bg-slate-900]="tab() === 'lot'" [class.text-white]="tab() === 'lot'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Lot-wise Profit &amp; Loss</button>
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
    }

    @if (tab() === 'low') {
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

    @if (tab() === 'lot') {
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-white">
            <tr>
              <th class="px-3 py-2 text-left">Product</th>
              <th class="px-3 py-2 text-left">Lot</th>
              <th class="px-3 py-2 text-right">Cost/Unit</th>
              <th class="px-3 py-2 text-right">Sold</th>
              <th class="px-3 py-2 text-right">Remaining</th>
              <th class="px-3 py-2 text-right">Profit / Loss</th>
            </tr>
          </thead>
          <tbody>
            @for (lot of lots(); track lot.id) {
              <tr class="border-t border-gray-200" [class.bg-red-50]="lot.totalProfit < 0">
                <td class="px-3 py-2">{{ lot.productName }}</td>
                <td class="px-3 py-2">{{ lot.id?.slice(0, 6) }}</td>
                <td class="px-3 py-2 text-right">Rs {{ lot.purchasePrice | number }}</td>
                <td class="px-3 py-2 text-right">{{ lot.quantitySold }}</td>
                <td class="px-3 py-2 text-right">{{ lot.quantityRemaining }}</td>
                <td class="px-3 py-2 text-right font-medium"
                    [class.text-green-700]="lot.totalProfit >= 0" [class.text-red-700]="lot.totalProfit < 0">
                  {{ lot.totalProfit < 0 ? '- ' : '' }}Rs {{ (lot.totalProfit < 0 ? -lot.totalProfit : lot.totalProfit) | number }}
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="px-3 py-4 text-center text-gray-400">No lots yet.</td></tr>
            }
          </tbody>
          @if (lots().length > 0) {
            <tfoot>
              <tr class="border-t-2 border-slate-300 bg-gray-50 font-semibold">
                <td class="px-3 py-2" colspan="5">Total</td>
                <td class="px-3 py-2 text-right" [class.text-green-700]="totalProfit() >= 0" [class.text-red-700]="totalProfit() < 0">
                  {{ totalProfit() < 0 ? '- ' : '' }}Rs {{ (totalProfit() < 0 ? -totalProfit() : totalProfit()) | number }}
                </td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
    }
  `,
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private lotService = inject(LotService);

  tab = signal<'stock' | 'low' | 'lot'>('stock');
  stockRows = signal<{ product: Product; totalRemaining: number; stockValue: number }[]>([]);
  lowStockRows = signal<{ product: Product; totalRemaining: number }[]>([]);
  lots = signal<Lot[]>([]);
  totalProfit = computed(() => this.lots().reduce((sum, l) => sum + (l.totalProfit ?? 0), 0));

  constructor() {
    this.lotService.list().subscribe((l) => this.lots.set(l));
  }

  async ngOnInit() {
    this.stockRows.set(await this.reportService.stockReport());
    this.lowStockRows.set(await this.reportService.lowStockReport());
  }
}