import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductService } from '../../core/services/product.service';
import { PurchaseService, PurchaseLineInput } from '../../core/services/purchase.service';
import { Supplier, Product, Purchase } from '../../core/models';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1 class="text-xl font-bold text-slate-800 mb-4">Purchase</h1>

    <div class="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
      <label class="block text-xs text-gray-500 mb-1">Supplier</label>
      <select [(ngModel)]="supplierId" class="border rounded px-3 py-2 text-sm w-full md:w-80 mb-4">
        <option value="" disabled selected>Select supplier…</option>
        @for (s of suppliers(); track s.id) {
          <option [value]="s.id">{{ s.name }}</option>
        }
      </select>

      <div class="space-y-2 mb-3">
        @for (line of lines(); track $index) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
            <select [(ngModel)]="line.productId" (ngModelChange)="onProductPick(line, $event)"
                    class="border rounded px-2 py-2 text-sm col-span-2 md:col-span-1">
              <option value="" disabled selected>Product…</option>
              @for (p of products(); track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
            <input [(ngModel)]="line.quantity" type="number" placeholder="Qty" class="border rounded px-2 py-2 text-sm" />
            <input [(ngModel)]="line.unitCost" type="number" placeholder="Unit cost" class="border rounded px-2 py-2 text-sm" />
            <button (click)="removeLine($index)" class="text-red-600 text-sm">Remove</button>
          </div>
        }
      </div>

      <button (click)="addLine()" class="text-blue-600 text-sm mb-4">+ Add line</button>

      <div class="flex items-center justify-between">
        <div class="font-semibold text-sm">Total: Rs {{ total() | number }}</div>
        <button (click)="submit()" [disabled]="!canSubmit()"
                class="bg-orange-600 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded">
          Save Purchase (creates lots)
        </button>
      </div>
    </div>

    <h2 class="text-sm font-semibold text-gray-600 mb-2">Recent Purchases</h2>
    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr><th class="px-3 py-2 text-left">Supplier</th><th class="px-3 py-2 text-left">Items</th><th class="px-3 py-2 text-right">Total</th></tr>
        </thead>
        <tbody>
          @for (p of purchases(); track p.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ p.supplierName }}</td>
              <td class="px-3 py-2">{{ p.items.length }} line(s)</td>
              <td class="px-3 py-2 text-right">Rs {{ p.totalCost | number }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class PurchaseComponent {
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private purchaseService = inject(PurchaseService);

  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  purchases = signal<Purchase[]>([]);
  supplierId = '';
  lines = signal<PurchaseLineInput[]>([{ productId: '', productName: '', quantity: 1, unitCost: 0 }]);

  constructor() {
    this.supplierService.list().subscribe((l) => this.suppliers.set(l));
    this.productService.list().subscribe((l) => this.products.set(l));
    this.purchaseService.list().subscribe((l) => this.purchases.set(l));
  }

  onProductPick(line: PurchaseLineInput, productId: string) {
    const p = this.products().find((x) => x.id === productId);
    line.productName = p?.name ?? '';
  }

  addLine() {
    this.lines.update((l) => [...l, { productId: '', productName: '', quantity: 1, unitCost: 0 }]);
  }

  removeLine(i: number) {
    this.lines.update((l) => l.filter((_, idx) => idx !== i));
  }

  total() {
    return this.lines().reduce((sum, l) => sum + (l.quantity || 0) * (l.unitCost || 0), 0);
  }

  canSubmit() {
    return this.supplierId && this.lines().length > 0 && this.lines().every((l) => l.productId && l.quantity > 0);
  }

  async submit() {
    const supplier = this.suppliers().find((s) => s.id === this.supplierId);
    if (!supplier) return;
    await this.purchaseService.createPurchase(supplier.id!, supplier.name, this.lines());
    this.lines.set([{ productId: '', productName: '', quantity: 1, unitCost: 0 }]);
    this.supplierId = '';
  }
}
