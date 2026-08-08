import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotService } from '../../core/services/lot.service';
import { Lot } from '../../core/models';

@Component({
  selector: 'app-lots',
  standalone: true,
  imports: [CommonModule],
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
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="w-full text-sm">
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
            @for (group of lotGroups(); track group.purchaseId) {
              <tr class="bg-slate-100">
                <td colspan="7" class="px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Purchase: {{ group.purchaseId.slice(0, 8) }} — {{ group.date | date:'medium' }}
                </td>
              </tr>
              @for (lot of group.lots; track lot.id) {
                <tr class="border-t border-gray-200" [class.bg-red-50]="lot.quantityRemaining === 0">
                  <td class="px-3 py-2">{{ lot.productName }}</td>
                  <td class="px-3 py-2">{{ lot.id?.slice(0, 6) }}</td>
                  <td class="px-3 py-2 text-right">Rs {{ lot.purchasePrice | number }}</td>
                  <td class="px-3 py-2 text-right">{{ lot.quantityPurchased }}</td>
                  <td class="px-3 py-2 text-right">{{ lot.quantitySold }}</td>
                  <td class="px-3 py-2 text-right font-medium">{{ lot.quantityRemaining }}</td>
                  <td class="px-3 py-2 text-right text-green-700 font-medium">Rs {{ lot.totalProfit | number }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="overflow-x-auto border border-gray-200 rounded">
        <table class="w-full text-sm">
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
            @for (row of productSummary(); track row.productId) {
              <tr class="border-t border-gray-200" [class.bg-red-50]="row.quantityRemaining === 0">
                <td class="px-3 py-2">{{ row.productName }}</td>
                <td class="px-3 py-2 text-right">Rs {{ row.avgCost | number:'1.2-2' }}</td>
                <td class="px-3 py-2 text-right">{{ row.quantityPurchased }}</td>
                <td class="px-3 py-2 text-right">{{ row.quantitySold }}</td>
                <td class="px-3 py-2 text-right font-medium">{{ row.quantityRemaining }}</td>
                <td class="px-3 py-2 text-right text-green-700 font-medium">Rs {{ row.totalProfit | number }}</td>
                <td class="px-3 py-2 text-right text-gray-500">{{ row.lotCount }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class LotsComponent {
  private lotService = inject(LotService);
  lots = signal<Lot[]>([]);
  view = signal<'lot' | 'product'>('product');

  lotGroups = computed(() => {
    const map = new Map<string, { purchaseId: string; date: Date; lots: Lot[] }>();

    for (const lot of this.lots()) {
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
}