import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotService } from '../../core/services/lot.service';
import { Lot } from '../../core/models';
import { PaginationComponent } from '../../core/shared/pagination';
import { SearchInputComponent } from '../../core/shared/search-input.component';

@Component({
  selector: 'app-lots',
  standalone: true,
  imports: [CommonModule,SearchInputComponent,PaginationComponent],
  template: `
    <h1 class="text-xl font-bold text-slate-800 mb-1">Lot Management</h1>
    <p class="text-xs text-gray-500 mb-4">Every purchase batch, tracked separately — this is also your lot-wise profit report.</p>

    <div class="flex gap-2 mb-4">
      <button (click)="view.set('product')"
              class="text-sm px-3 py-1.5 rounded"
              [class.bg-orange-600]="view() === 'product'" [class.text-white]="view() === 'product'"
              [class.bg-gray-100]="view() !== 'product'" [class.text-gray-600]="view() !== 'product'">
        Product-wise
      </button>
      <button (click)="view.set('lot')"
              class="text-sm px-3 py-1.5 rounded"
              [class.bg-orange-600]="view() === 'lot'" [class.text-white]="view() === 'lot'"
              [class.bg-gray-100]="view() !== 'lot'" [class.text-gray-600]="view() !== 'lot'">
        Lot-wise
      </button>
    </div>

    @if (view() === 'lot') {
      <div class="mb-3">
      <app-search-input
        [value]="searchTerm()"
        (valueChange)="onSearchChange($event)"
        placeholder="Search by name"
      />
    </div>
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="responsive-table w-full text-sm">
          <thead class="bg-slate-900 text-white">
            <tr>
              <th class="px-3 py-2 text-left">Product</th>
              <th class="px-3 py-2 text-left">Lot</th>
              <th class="px-3 py-2 text-right">Cost/Unit</th>
              <th class="px-3 py-2 text-right">Purchased</th>
              <th class="px-3 py-2 text-right">Sold</th>
              <th class="px-3 py-2 text-right">Remaining</th>
              <th class="px-3 py-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            @for (group of paginatedLots(); track group.purchaseId) {
              <tr class="bg-slate-100">
                <td data-label="Product" colspan="7" class="px-3 py-1.5 text-xs font-semibold text-slate-600"><div class="cell-value">
                  Purchase: {{ group.purchaseId.slice(0, 8) }} — {{ group.date | date:'medium' }}
                </div></td>
              </tr>
              @for (lot of group.lots; track lot.id) {
                <tr class="border-t border-gray-200" [class.bg-red-50]="lot.quantityRemaining === 0">
                  <td data-label="Product" class="px-3 py-2"><div class="cell-value">{{ lot.productName }} @if ($any(lot)._sync) { <span class="pending-badge">Saved on device</span> }</div></td>
                  <td data-label="Lot" class="px-3 py-2"><div class="cell-value">{{ lot.id?.slice(0, 6) }}</div></td>
                  <td data-label="Cost/Unit" class="px-3 py-2 text-right"><div class="cell-value">Rs {{ lot.purchasePrice | number }}</div></td>
                  <td data-label="Purchased" class="px-3 py-2 text-right"><div class="cell-value">{{ lot.quantityPurchased }}</div></td>
                  <td data-label="Sold" class="px-3 py-2 text-right"><div class="cell-value">{{ lot.quantitySold }}</div></td>
                  <td data-label="Remaining" class="px-3 py-2 text-right font-medium"><div class="cell-value">{{ lot.quantityRemaining }}</div></td>
                  <td data-label="Profit" class="px-3 py-2 text-right text-green-700 font-medium"><div class="cell-value">Rs {{ lot.totalProfit | number }}</div></td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
      <app-pagination
      [totalItems]="filteredLots().length"
      [pageSize]="pageSize"
      [currentPage]="currentPage()"
      (currentPageChange)="currentPage.set($event)"
    />
    } @else {
      <div class="mb-3">
      <app-search-input
        [value]="searchProductTerm()"
        (valueChange)="onSearchProductChange($event)"
        placeholder="Search by name"
      />
    </div>
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="responsive-table w-full text-sm">
          <thead class="bg-slate-900 text-white">
            <tr>
              <th class="px-3 py-2 text-left">Product</th>
              <th class="px-3 py-2 text-right">Avg Cost/Unit</th>
              <th class="px-3 py-2 text-right">Purchased</th>
              <th class="px-3 py-2 text-right">Sold</th>
              <th class="px-3 py-2 text-right">Remaining</th>
              <th class="px-3 py-2 text-right">Profit</th>
              <th class="px-3 py-2 text-right">Lots</th>
            </tr>
          </thead>
          <tbody>
            @for (row of paginatedProducts(); track row.productId) {
              <tr class="border-t border-gray-200" [class.bg-red-50]="row.quantityRemaining === 0">
                <td data-label="Product" class="px-3 py-2"><div class="cell-value">{{ row.productName }} @if ($any(row)._sync) { <span class="pending-badge">Saved on device</span> }</div></td>
                <td data-label="Avg Cost/Unit" class="px-3 py-2 text-right"><div class="cell-value">Rs {{ row.avgCost | number:'1.2-2' }}</div></td>
                <td data-label="Purchased" class="px-3 py-2 text-right"><div class="cell-value">{{ row.quantityPurchased }}</div></td>
                <td data-label="Sold" class="px-3 py-2 text-right"><div class="cell-value">{{ row.quantitySold }}</div></td>
                <td data-label="Remaining" class="px-3 py-2 text-right font-medium"><div class="cell-value">{{ row.quantityRemaining }}</div></td>
                <td data-label="Profit" class="px-3 py-2 text-right text-green-700 font-medium"><div class="cell-value">Rs {{ row.totalProfit | number }}</div></td>
                <td data-label="Lots" class="px-3 py-2 text-right text-gray-500"><div class="cell-value">{{ row.lotCount }}</div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
      [totalItems]="filteredProducts().length"
      [pageSize]="pageSize"
      [currentPage]="currentPage()"
      (currentPageChange)="currentPage.set($event)"
    />
    }
  `,
})
export class LotsComponent {
  private lotService = inject(LotService);
  lots = signal<Lot[]>([]);
  view = signal<'lot' | 'product'>('product');

  lotGroups = computed(() => {
    const map = new Map<string, { purchaseId: string; date: Date; lots: Lot[] }>();

    for (const lot of this.filteredLots()) {
      const purchaseId = (lot as any).purchaseId ?? 'unknown';
      const date = (lot as any).purchaseDate?.toDate?.() ?? new Date(0);
      const existing = map.get(purchaseId);
      if (existing) {
        existing.lots.push(lot);
      } else {
        map.set(purchaseId, { purchaseId, date, lots: [lot] });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  productSummary = computed(() => {
    const map = new Map<string, {
      productId: string; productName: string;
      quantityPurchased: number; quantitySold: number; quantityRemaining: number;
      totalProfit: number; totalCostSpent: number; lotCount: number;
    }>();

    for (const lot of this.lots()) {
      const key = lot.productId;
      const existing = map.get(key) ?? {
        productId: key,
        productName: lot.productName,
        quantityPurchased: 0,
        quantitySold: 0,
        quantityRemaining: 0,
        totalProfit: 0,
        totalCostSpent: 0,
        lotCount: 0,
      };
      existing.quantityPurchased += lot.quantityPurchased || 0;
      existing.quantitySold += lot.quantitySold || 0;
      existing.quantityRemaining += lot.quantityRemaining || 0;
      existing.totalProfit += lot.totalProfit || 0;
      existing.totalCostSpent += (lot.purchasePrice || 0) * (lot.quantityPurchased || 0);
      existing.lotCount += 1;
      map.set(key, existing);
    }

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        avgCost: row.quantityPurchased > 0 ? row.totalCostSpent / row.quantityPurchased : 0,
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName));
  });

  constructor() {
    this.lotService.list().subscribe((l) => this.lots.set(l));
  }
  searchTerm = signal('');
  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }
  searchProductTerm = signal('');
  onSearchProductChange(term: string) {
    this.searchProductTerm.set(term);
    this.currentPage.set(1);
  }
  currentPage = signal(1);
  pageSize = 10;
  filteredLots = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.lots();

    return this.lots().filter((lot) =>
      [lot.productName].some((field) =>
        (field ?? '').toLowerCase().includes(term)
      )
    );
  });
  paginatedLots = computed(() => {
    const lots = this.lotGroups();
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;

    return lots.slice(start, end);
  });
  filteredProducts = computed(() => {
    const term = this.searchProductTerm().trim().toLowerCase();
    if (!term) return this.productSummary();

    return this.productSummary().filter((product) =>
      [product.productName].some((field) =>
        (field ?? '').toLowerCase().includes(term)
      )
    );
  });
  paginatedProducts = computed(() => {
    const lots = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;

    return lots.slice(start, end);
  });
}
