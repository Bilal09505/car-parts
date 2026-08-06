import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { LotService } from '../../core/services/lot.service';
import { SaleService, SaleLineInput } from '../../core/services/sale.service';
import { Product, Customer, Lot, Sale } from '../../core/models';

interface CartLine extends SaleLineInput {
  lotLabel: string;
  maxQty: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1 class="text-xl font-bold text-slate-800 mb-4">Sales</h1>

    <div class="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
      <label class="block text-xs text-gray-500 mb-1">Customer (optional)</label>
      <select [(ngModel)]="customerId" class="border rounded px-3 py-2 text-sm w-full md:w-80 mb-4">
        <option value="">Walk-in customer</option>
        @for (c of customers(); track c.id) {
          <option [value]="c.id">{{ c.name }}</option>
        }
      </select>

      <label class="block text-xs text-gray-500 mb-1">1. Pick a product</label>
      <select [(ngModel)]="selectedProductId" (ngModelChange)="onProductPick($event)"
              class="border rounded px-3 py-2 text-sm w-full md:w-80 mb-4">
        <option value="" disabled selected>Select product…</option>
        @for (p of products(); track p.id) {
          <option [value]="p.id">{{ p.name }}</option>
        }
      </select>

      @if (availableLots().length > 0) {
        <label class="block text-xs text-gray-500 mb-1">2. Pick a lot — remaining qty and cost shown so you choose deliberately</label>
        <div class="space-y-2 mb-4">
          @for (lot of availableLots(); track lot.id) {
            <div class="flex flex-wrap items-center gap-2 border border-gray-200 rounded p-2 bg-white text-sm">
              <span class="font-medium">Lot {{ lot.id?.slice(0, 6) }}</span>
              <span class="text-gray-500">Remaining: {{ lot.quantityRemaining }}</span>
              <span class="text-gray-500">Cost: Rs {{ lot.purchasePrice | number }}</span>
              <input type="number" placeholder="Qty" [(ngModel)]="qtyInputs[lot.id!]" class="border rounded px-2 py-1 w-20" />
              <input type="number" placeholder="Sale price" [(ngModel)]="priceInputs[lot.id!]" class="border rounded px-2 py-1 w-28" />
              <button (click)="addToCart(lot)" class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded">Add to Sale</button>
            </div>
          }
        </div>
      } @else if (selectedProductId) {
        <p class="text-sm text-red-600 mb-4">No stock left for this product in any lot.</p>
      }

      @if (cart().length > 0) {
        <h3 class="text-sm font-semibold text-gray-600 mb-2">Sale Cart</h3>
        <div class="space-y-1 mb-3">
          @for (line of cart(); track $index) {
            <div class="flex justify-between text-sm border-b border-gray-100 pb-1">
              <span>{{ line.productName }} — {{ line.lotLabel }} × {{ line.quantity }}</span>
              <span>Rs {{ line.quantity * line.salePrice | number }}
                <button (click)="removeFromCart($index)" class="text-red-600 ml-2">✕</button>
              </span>
            </div>
          }
        </div>
        <div class="flex items-center justify-between">
          <div class="font-semibold text-sm">Total: Rs {{ cartTotal() | number }}</div>
          <button (click)="submitSale()" class="bg-orange-600 text-white text-sm px-4 py-2 rounded">
            Complete Sale
          </button>
        </div>
      }
    </div>

    <h2 class="text-sm font-semibold text-gray-600 mb-2">Recent Sales</h2>
    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr><th class="px-3 py-2 text-left">Customer</th><th class="px-3 py-2 text-right">Amount</th><th class="px-3 py-2 text-right">Profit</th></tr>
        </thead>
        <tbody>
          @for (s of sales(); track s.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ s.customerName || 'Walk-in' }}</td>
              <td class="px-3 py-2 text-right">Rs {{ s.totalAmount | number }}</td>
              <td class="px-3 py-2 text-right text-green-700 font-medium">Rs {{ s.totalProfit | number }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class SalesComponent {
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private lotService = inject(LotService);
  private saleService = inject(SaleService);

  products = signal<Product[]>([]);
  customers = signal<Customer[]>([]);
  sales = signal<Sale[]>([]);
  availableLots = signal<Lot[]>([]);
  cart = signal<CartLine[]>([]);

  customerId = '';
  selectedProductId = '';
  qtyInputs: Record<string, number> = {};
  priceInputs: Record<string, number> = {};

  constructor() {
    this.productService.list().subscribe((l) => this.products.set(l));
    this.customerService.list().subscribe((l) => this.customers.set(l));
    this.saleService.list().subscribe((l) => this.sales.set(l));
  }

  onProductPick(productId: string) {
    this.lotService.listAvailableForProduct(productId).subscribe((lots) => this.availableLots.set(lots));
  }

  addToCart(lot: Lot) {
    const qty = this.qtyInputs[lot.id!];
    const price = this.priceInputs[lot.id!];
    if (!qty || qty <= 0 || qty > lot.quantityRemaining) {
      alert(`Enter a valid quantity (max ${lot.quantityRemaining})`);
      return;
    }
    if (!price || price <= 0) {
      alert('Enter a sale price');
      return;
    }
    this.cart.update((c) => [...c, {
      lotId: lot.id!,
      productId: lot.productId,
      productName: lot.productName,
      quantity: qty,
      salePrice: price,
      lotLabel: `Lot ${lot.id!.slice(0, 6)}`,
      maxQty: lot.quantityRemaining,
    }]);
    this.qtyInputs[lot.id!] = 0;
    this.priceInputs[lot.id!] = 0;
  }

  removeFromCart(i: number) {
    this.cart.update((c) => c.filter((_, idx) => idx !== i));
  }

  cartTotal() {
    return this.cart().reduce((sum, l) => sum + l.quantity * l.salePrice, 0);
  }

  async submitSale() {
    const customer = this.customers().find((c) => c.id === this.customerId);
    try {
      await this.saleService.recordSale(this.customerId || null, customer?.name ?? 'Walk-in', this.cart());
      this.cart.set([]);
      this.selectedProductId = '';
      this.availableLots.set([]);
    } catch (err: any) {
      alert(err.message ?? 'Sale failed — stock may have changed, please retry.');
    }
  }
}
