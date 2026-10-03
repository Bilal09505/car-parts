import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { LotService } from '../../core/services/lot.service';
import { Product, Lot } from '../../core/models';
import { SearchInputComponent } from '../../core/shared/search-input.component';
import { PaginationComponent } from '../../core/shared/pagination';
import { MonthlyProfitLossComponent } from '../../core/shared/monthly-profit-loss.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, SearchInputComponent, PaginationComponent, MonthlyProfitLossComponent],
  template: `
    <h1 class="text-xl font-bold text-slate-800 mb-4">Reports</h1>
    @if (error() && (tab() === 'stock' || tab() === 'low')) { <div class="notice notice-warning" role="alert">{{ error() }} <button class="secondary-button" (click)="refresh()">Retry</button></div> }
    @if (loading() && (tab() === 'stock' || tab() === 'low')) { <div class="notice" role="status">Loading downloaded stock data…</div> }

    <div class="flex gap-2 mb-4 flex-wrap">
      <button (click)="setTab('stock')" [class.bg-slate-900]="tab() === 'stock'" [class.text-white]="tab() === 'stock'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Stock Report</button>
      <button (click)="setTab('low')" [class.bg-slate-900]="tab() === 'low'" [class.text-white]="tab() === 'low'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Low Stock Report</button>
      <button (click)="setTab('lot')" [class.bg-slate-900]="tab() === 'lot'" [class.text-white]="tab() === 'lot'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Lot-wise Profit &amp; Loss</button>
      <button (click)="setTab('monthly')" [class.bg-slate-900]="tab() === 'monthly'" [class.text-white]="tab() === 'monthly'"
              class="text-sm px-3 py-1.5 rounded border border-gray-300">Monthly Profit &amp; Loss</button>
    </div>

    @if (tab() === 'monthly') {
      <app-monthly-profit-loss [showBreakdown]="true" />
    } @else {
    <div class="mb-3">
      <app-search-input
        [value]="searchTerm()"
        (valueChange)="onSearchChange($event)"
        placeholder="Search by product name..."
      />
    </div>
    }

    @if (tab() === 'stock' && !loading() && !error()) {
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="responsive-table w-full text-sm">
          <thead class="bg-slate-900 text-white">
            <tr>
              <th class="px-3 py-2 text-left">Product</th>
              <th class="px-3 py-2 text-right">Remaining</th>
              <th class="px-3 py-2 text-right">Stock Value</th>
            </tr>
          </thead>
          <tbody>
            @for (row of paginatedStock(); track row.product.id) {
              <tr class="border-t border-gray-200">
                <td data-label="Product" class="px-3 py-2"><div class="cell-value">{{ row.product.name }} @if ($any(row)._sync) { <span class="pending-badge">Saved on device</span> }</div></td>
                <td data-label="Remaining" class="px-3 py-2 text-right"><div class="cell-value">{{ row.totalRemaining }}</div></td>
                <td data-label="Stock Value" class="px-3 py-2 text-right"><div class="cell-value">Rs {{ row.stockValue | number }}</div></td>
              </tr>
            } @empty {
              <tr><td data-label="Product" colspan="3" class="px-3 py-4 text-center text-gray-400"><div class="cell-value">No results.</div></td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [totalItems]="filteredStock().length"
        [pageSize]="pageSize"
        [currentPage]="currentPage()"
        (currentPageChange)="currentPage.set($event)"
      />
    }

    @if (tab() === 'low' && !loading() && !error()) {
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="responsive-table w-full text-sm">
          <thead class="bg-slate-900 text-white">
            <tr>
              <th class="px-3 py-2 text-left">Product</th>
              <th class="px-3 py-2 text-right">Remaining</th>
              <th class="px-3 py-2 text-right">Reorder Level</th>
            </tr>
          </thead>
          <tbody>
            @for (row of paginatedLow(); track row.product.id) {
              <tr class="border-t border-gray-200 bg-red-50">
                <td data-label="Product" class="px-3 py-2"><div class="cell-value">{{ row.product.name }} @if ($any(row)._sync) { <span class="pending-badge">Saved on device</span> }</div></td>
                <td data-label="Remaining" class="px-3 py-2 text-right font-medium text-red-700"><div class="cell-value">{{ row.totalRemaining }}</div></td>
                <td data-label="Reorder Level" class="px-3 py-2 text-right"><div class="cell-value">{{ row.product.reorderLevel }}</div></td>
              </tr>
            } @empty {
              <tr><td data-label="Product" colspan="3" class="px-3 py-4 text-center text-gray-400"><div class="cell-value">No results.</div></td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [totalItems]="filteredLow().length"
        [pageSize]="pageSize"
        [currentPage]="currentPage()"
        (currentPageChange)="currentPage.set($event)"
      />
    }

    @if (tab() === 'lot') {
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="responsive-table w-full text-sm">
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
            @for (lot of paginatedLots(); track lot.id) {
              <tr class="border-t border-gray-200" [class.bg-red-50]="lot.totalProfit < 0">
                <td data-label="Product" class="px-3 py-2"><div class="cell-value">{{ lot.productName }} @if ($any(lot)._sync) { <span class="pending-badge">Saved on device</span> }</div></td>
                <td data-label="Lot" class="px-3 py-2"><div class="cell-value">{{ lot.id?.slice(0, 6) }}</div></td>
                <td data-label="Cost/Unit" class="px-3 py-2 text-right"><div class="cell-value">Rs {{ lot.purchasePrice | number }}</div></td>
                <td data-label="Sold" class="px-3 py-2 text-right"><div class="cell-value">{{ lot.quantitySold }}</div></td>
                <td data-label="Remaining" class="px-3 py-2 text-right"><div class="cell-value">{{ lot.quantityRemaining }}</div></td>
                <td data-label="Profit / Loss" class="px-3 py-2 text-right font-medium"
                    [class.text-green-700]="lot.totalProfit >= 0" [class.text-red-700]="lot.totalProfit < 0"><div class="cell-value">
                  {{ lot.totalProfit < 0 ? '- ' : '' }}Rs {{ (lot.totalProfit < 0 ? -lot.totalProfit : lot.totalProfit) | number }}
                </div></td>
              </tr>
            } @empty {
              <tr><td data-label="Product" colspan="6" class="px-3 py-4 text-center text-gray-400"><div class="cell-value">No lots yet.</div></td></tr>
            }
          </tbody>
          @if (filteredLots().length > 0) {
            <tfoot>
              <tr class="border-t-2 border-slate-300 bg-gray-50 font-semibold">
                <td data-label="Product" class="px-3 py-2" colspan="5"><div class="cell-value">Total</div></td>
                <td data-label="Profit / Loss" class="px-3 py-2 text-right" [class.text-green-700]="totalProfit() >= 0" [class.text-red-700]="totalProfit() < 0"><div class="cell-value">
                  {{ totalProfit() < 0 ? '- ' : '' }}Rs {{ (totalProfit() < 0 ? -totalProfit() : totalProfit()) | number }}
                </div></td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
      <app-pagination
        [totalItems]="filteredLots().length"
        [pageSize]="pageSize"
        [currentPage]="currentPage()"
        (currentPageChange)="currentPage.set($event)"
      />
    }
  `,
})
export class ReportsComponent {
  private reportService = inject(ReportService);
  private lotService = inject(LotService);

  tab = signal<'stock' | 'low' | 'lot' | 'monthly'>('stock');
  stockRows = signal<{ product: Product; totalRemaining: number; stockValue: number }[]>([]);
  lowStockRows = signal<{ product: Product; totalRemaining: number }[]>([]);
  lots = signal<Lot[]>([]);

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  loading = signal(true);
  error = signal('');
  private requestId = 0;

  constructor() {
    this.lotService.list().subscribe((l) => this.lots.set(l));
    effect(onCleanup => {
      this.reportService.revision();
      const timer = setTimeout(() => { void this.refresh(); }, 100);
      onCleanup(() => clearTimeout(timer));
    });
  }

  async refresh() {
    const requestId = ++this.requestId;
    this.error.set('');
    try {
      const stock = await this.reportService.stockReport();
      if (requestId !== this.requestId) return;
      this.stockRows.set(stock);
      this.lowStockRows.set(stock.filter(row => row.totalRemaining <= row.product.reorderLevel));
    } catch (error: any) {
      if (requestId === this.requestId) this.error.set(error.message ?? 'Report is unavailable offline.');
    } finally {
      if (requestId === this.requestId) this.loading.set(false);
    }
  }

  setTab(t: 'stock' | 'low' | 'lot' | 'monthly') {
    this.tab.set(t);
    this.currentPage.set(1);
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  // --- filtered ---
  filteredStock = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.stockRows();
    return this.stockRows().filter(r => r.product.name.toLowerCase().includes(term));
  });

  filteredLow = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.lowStockRows();
    return this.lowStockRows().filter(r => r.product.name.toLowerCase().includes(term));
  });

  filteredLots = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.lots();
    return this.lots().filter(l => (l.productName ?? '').toLowerCase().includes(term));
  });

  // --- paginated ---
  paginatedStock = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredStock().slice(start, start + this.pageSize);
  });

  paginatedLow = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredLow().slice(start, start + this.pageSize);
  });

  paginatedLots = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredLots().slice(start, start + this.pageSize);
  });

  // total profit on filtered lots (not just current page)
  totalProfit = computed(() => this.filteredLots().reduce((sum, l) => sum + (l.totalProfit ?? 0), 0));
}
