import { Component, inject, signal } from '@angular/core';
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
          @for (lot of lots(); track lot.id) {
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
        </tbody>
      </table>
    </div>
  `,
})
export class LotsComponent {
  private lotService = inject(LotService);
  lots = signal<Lot[]>([]);

  constructor() {
    this.lotService.list().subscribe((l) => this.lots.set(l));
  }
}
