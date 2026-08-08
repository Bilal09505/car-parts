import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ModelService } from '../../core/services/model.service';
import { TypeService } from '../../core/services/type.service';
import { PurchaseService, PurchaseLineInput } from '../../core/services/purchase.service';
import { Supplier, Product, Purchase, Category, CarModel, ProductType } from '../../core/models';
import { SHOP_INFO } from '../../core/shop-info';

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

      <div class="space-y-3 mb-3">
        @for (line of lines(); track $index) {
          <div class="border border-gray-200 rounded p-3 bg-white">
            <div class="grid grid-cols-3 gap-2 mb-2">
              <select [(ngModel)]="line.categoryFilter" class="border rounded px-2 py-2 text-xs">
                <option value="">All categories</option>
                @for (c of categories(); track c.id) {
                  <option [value]="c.name">{{ c.name }}</option>
                }
              </select>
              <select [(ngModel)]="line.modelFilter" class="border rounded px-2 py-2 text-xs">
                <option value="">All models</option>
                @for (m of models(); track m.id) {
                  <option [value]="m.name">{{ m.name }}</option>
                }
              </select>
              <select [(ngModel)]="line.typeFilter" class="border rounded px-2 py-2 text-xs">
                <option value="">All types</option>
                @for (t of types(); track t.id) {
                  <option [value]="t.name">{{ t.name }}</option>
                }
              </select>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
              <select
                [(ngModel)]="line.productId"
                (ngModelChange)="onProductPick(line, $event)"
                class="border rounded px-2 py-2 text-sm col-span-2 md:col-span-1"
              >
                <option value="" disabled selected>Product…</option>
                @for (p of filteredProducts(line); track p.id) {
                  <option [value]="p.id">{{ p.name }}</option>
                }
              </select>
              <input
                [(ngModel)]="line.quantity"
                type="number"
                placeholder="Qty"
                class="border rounded px-2 py-2 text-sm"
              />
              <input
                [(ngModel)]="line.unitCost"
                type="number"
                placeholder="Unit cost"
                class="border rounded px-2 py-2 text-sm"
              />
              <button (click)="removeLine($index)" class="text-red-600 text-sm">Remove</button>
            </div>
          </div>
        }
      </div>

      <button (click)="addLine()" class="text-blue-600 text-sm mb-4">+ Add line</button>

      <div class="flex items-center justify-between">
        <div class="font-semibold text-sm">Total: Rs {{ total() | number }}</div>
        <button
          (click)="submit()"
          [disabled]="!canSubmit() || isSubmitting"
          class="bg-orange-600 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded"
        >
          {{ isSubmitting ? 'Saving...' : 'Save Purchase (creates lots)' }}
        </button>
      </div>
    </div>

    <h2 class="text-sm font-semibold text-gray-600 mb-2">Recent Purchases</h2>
    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr>
            <th class="px-3 py-2 text-left">Supplier</th>
            <th class="px-3 py-2 text-left">Items</th>
            <th class="px-3 py-2 text-right">Total</th>
            <th class="px-3 py-2 text-right">Bill</th>
          </tr>
        </thead>
        <tbody>
          @for (p of purchases(); track p.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ p.supplierName }}</td>
              <td class="px-3 py-2">{{ p.items.length }} line(s)</td>
              <td class="px-3 py-2 text-right">Rs {{ p.totalCost | number }}</td>
              <td class="px-3 py-2 text-right">
                <button
                  (click)="openBill(p)"
                  class="bg-slate-800 text-white text-xs px-3 py-1.5 rounded"
                >
                  View Bill
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (billPurchase()) {
      <div
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        (click)="closeBill()"
      >
        <div
          class="bg-white rounded shadow-lg w-full max-w-md p-5"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-slate-800 text-sm">Purchase Bill</h2>
            <button (click)="closeBill()" class="text-gray-500 text-lg leading-none">✕</button>
          </div>

          <div class="text-center border-b border-gray-200 pb-3 mb-3">
            <div class="font-bold text-slate-800 text-base">{{ shop.name }}</div>
            <div class="text-xs text-gray-500">{{ shop.address }}</div>
            <div class="text-xs text-gray-500">{{ shop.phone }} · {{ shop.email }}</div>
          </div>

          <div class="text-xs text-gray-500 mb-3">
            <div>Supplier: {{ billPurchase()!.supplierName }}</div>
            @if (billPurchase()!.date) {
              <div>
                Date:
                {{
                  billPurchase()!.date.toDate
                    ? (billPurchase()!.date.toDate() | date: 'medium')
                    : billPurchase()!.date
                }}
              </div>
            }
          </div>

          <table class="w-full text-sm mb-3">
            <thead>
              <tr class="border-b border-gray-200 text-gray-500 text-xs">
                <th class="text-left py-1">Item</th>
                <th class="text-right py-1">Qty</th>
                <th class="text-right py-1">Cost</th>
                <th class="text-right py-1">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              @for (item of billPurchase()!.items; track $index) {
                <tr class="border-b border-gray-100">
                  <td class="py-1">{{ item.productName }}</td>
                  <td class="py-1 text-right">{{ item.quantity }}</td>
                  <td class="py-1 text-right">Rs {{ item.unitCost | number }}</td>
                  <td class="py-1 text-right">Rs {{ item.quantity * item.unitCost | number }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="py-2 text-center text-gray-400 text-xs">
                    No items on this purchase.
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <div class="flex justify-between font-semibold text-sm border-t border-gray-200 pt-2">
            <span>Total</span>
            <span>Rs {{ billPurchase()!.totalCost | number }}</span>
          </div>

          <div class="text-center text-xs text-gray-400 mt-4">Thank you</div>

          <button
            onclick="window.print()"
            class="bg-orange-600 text-white text-sm px-3 py-2 rounded w-full mt-4"
          >
            Print
          </button>
        </div>
      </div>
    }
  `,
})
export class PurchaseComponent {
  shop = SHOP_INFO;
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private modelService = inject(ModelService);
  private typeService = inject(TypeService);
  private purchaseService = inject(PurchaseService);

  isSubmitting = false;
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  models = signal<CarModel[]>([]);
  types = signal<ProductType[]>([]);
  purchases = signal<Purchase[]>([]);
  supplierId = '';

  billPurchase = signal<Purchase | null>(null);

  lines = signal<PurchaseLineInput[]>([
    {
      productId: '',
      productName: '',
      quantity: 1,
      unitCost: 0,
      categoryFilter: '',
      modelFilter: '',
      typeFilter: '',
    },
  ]);

  constructor() {
    this.supplierService.list().subscribe((l) => this.suppliers.set(l));
    this.productService.list().subscribe((l) => this.products.set(l));
    this.categoryService.list().subscribe((l) => this.categories.set(l));
    this.modelService.list().subscribe((l) => this.models.set(l));
    this.typeService.list().subscribe((l) => this.types.set(l));
    this.purchaseService.list().subscribe((l) => this.purchases.set(l));
  }

  filteredProducts(line: PurchaseLineInput) {
    return this.products().filter(
      (p) =>
        (!line.categoryFilter || p.category === line.categoryFilter) &&
        (!line.modelFilter || p.model === line.modelFilter) &&
        (!line.typeFilter || p.type === line.typeFilter),
    );
  }

  onProductPick(line: PurchaseLineInput, productId: string) {
    const p = this.products().find((x) => x.id === productId);
    line.productName = p?.name ?? '';
  }

  addLine() {
    this.lines.update((l) => [
      ...l,
      {
        productId: '',
        productName: '',
        quantity: 1,
        unitCost: 0,
        categoryFilter: '',
        modelFilter: '',
        typeFilter: '',
      },
    ]);
  }

  removeLine(i: number) {
    this.lines.update((l) => l.filter((_, idx) => idx !== i));
  }

  total() {
    return this.lines().reduce((sum, l) => sum + (l.quantity || 0) * (l.unitCost || 0), 0);
  }

  canSubmit() {
    return (
      this.supplierId &&
      this.lines().length > 0 &&
      this.lines().every((l) => l.productId && l.quantity > 0)
    );
  }

  openBill(purchase: Purchase) {
    this.billPurchase.set(purchase);
  }

  closeBill() {
    this.billPurchase.set(null);
  }

  async submit() {
    const supplier = this.suppliers().find((s) => s.id === this.supplierId);
    if (!supplier) return;

    this.isSubmitting = true;
    try {
      await this.purchaseService.createPurchase(supplier.id!, supplier.name, this.lines());
      this.lines.set([
        {
          productId: '',
          productName: '',
          quantity: 1,
          unitCost: 0,
          categoryFilter: '',
          modelFilter: '',
          typeFilter: '',
        },
      ]);
      this.supplierId = '';
    } finally {
      this.isSubmitting = false;
    }
  }
}
