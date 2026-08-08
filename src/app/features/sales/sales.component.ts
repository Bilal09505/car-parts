import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { CategoryService } from '../../core/services/category.service';
import { ModelService } from '../../core/services/model.service';
import { TypeService } from '../../core/services/type.service';
import { LotService } from '../../core/services/lot.service';
import { SaleService, SaleLineInput } from '../../core/services/sale.service';
import { Product, Customer, Lot, Sale, Category, CarModel, ProductType } from '../../core/models';
import { SHOP_INFO } from '../../core/shop-info';

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

      <label class="block text-xs text-gray-500 mb-1">1. Filter and pick a product</label>
      <div class="grid grid-cols-3 gap-2 w-full md:w-80 mb-2">
        <select [(ngModel)]="categoryFilter" class="border rounded px-2 py-2 text-xs">
          <option value="">All categories</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.name">{{ c.name }}</option>
          }
        </select>
        <select [(ngModel)]="modelFilter" class="border rounded px-2 py-2 text-xs">
          <option value="">All models</option>
          @for (m of models(); track m.id) {
            <option [value]="m.name">{{ m.name }}</option>
          }
        </select>
        <select [(ngModel)]="typeFilter" class="border rounded px-2 py-2 text-xs">
          <option value="">All types</option>
          @for (t of types(); track t.id) {
            <option [value]="t.name">{{ t.name }}</option>
          }
        </select>
      </div>

      <select
        [(ngModel)]="selectedProductId"
        (ngModelChange)="onProductPick($event)"
        class="border rounded px-3 py-2 text-sm w-full md:w-80 mb-4"
      >
        <option value="" disabled selected>Select product…</option>
        @for (p of filteredProducts(); track p.id) {
          <option [value]="p.id">{{ p.name }}</option>
        }
      </select>

      @if (availableLots().length > 0) {
        <label class="block text-xs text-gray-500 mb-1"
          >2. Pick a lot — remaining qty and cost shown so you choose deliberately</label
        >
        <div class="space-y-2 mb-4">
          @for (lot of availableLots(); track lot.id) {
            <div
              class="flex flex-wrap items-center gap-2 border border-gray-200 rounded p-2 bg-white text-sm"
            >
              <span class="font-medium">Lot {{ lot.id?.slice(0, 6) }}</span>
              <span class="text-gray-500">Remaining: {{ lot.quantityRemaining }}</span>
              <span class="text-gray-500">Cost: Rs {{ lot.purchasePrice | number }}</span>
              <input
                type="number"
                placeholder="Qty"
                [(ngModel)]="qtyInputs[lot.id!]"
                class="border rounded px-2 py-1 w-20"
              />
              <input
                type="number"
                placeholder="Sale price"
                [(ngModel)]="priceInputs[lot.id!]"
                class="border rounded px-2 py-1 w-28"
              />
              <button
                (click)="addToCart(lot)"
                class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded"
              >
                Add to Sale
              </button>
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
              <span
                >Rs {{ line.quantity * line.salePrice | number }}
                <button (click)="removeFromCart($index)" class="text-red-600 ml-2">✕</button>
              </span>
            </div>
          }
        </div>
        <div class="flex items-center justify-between">
          <div class="font-semibold text-sm">Total: Rs {{ cartTotal() | number }}</div>
          <button
            (click)="submitSale()"
            class="bg-orange-600 text-white text-sm px-4 py-2 rounded"
            [disabled]="isSubmitting"
          >
            {{ isSubmitting ? 'Completing' : 'Complete Sale' }}
          </button>
        </div>
      }
    </div>

    <h2 class="text-sm font-semibold text-gray-600 mb-2">Recent Sales</h2>
    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr>
            <th class="px-3 py-2 text-left">Customer</th>
            <th class="px-3 py-2 text-right">Amount</th>
            <th class="px-3 py-2 text-right">Profit</th>
            <th class="px-3 py-2 text-right">Bill</th>
          </tr>
        </thead>
        <tbody>
          @for (s of sales(); track s.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ s.customerName || 'Walk-in' }}</td>
              <td class="px-3 py-2 text-right">Rs {{ s.totalAmount | number }}</td>
              <td class="px-3 py-2 text-right text-green-700 font-medium">
                Rs {{ s.totalProfit | number }}
              </td>
              <td class="px-3 py-2 text-right">
                <button
                  (click)="openBill(s)"
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

    @if (billSale()) {
      <div
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        (click)="closeBill()"
      >
        <div
          class="bg-white rounded shadow-lg w-full max-w-md p-5"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-slate-800 text-sm">Sale Receipt</h2>
            <button (click)="closeBill()" class="text-gray-500 text-lg leading-none">✕</button>
          </div>

          <div class="text-center border-b border-gray-200 pb-3 mb-3">
            <div class="font-bold text-slate-800 text-base">{{ shop.name }}</div>
            <div class="text-xs text-gray-500">{{ shop.address }}</div>
            <div class="text-xs text-gray-500">{{ shop.phone }} · {{ shop.email }}</div>
          </div>

          <div class="text-xs text-gray-500 mb-3">
            <div>Customer: {{ billSale()!.customerName || 'Walk-in' }}</div>
            @if (billSale()!.date) {
              <div>
                Date:
                {{
                  billSale()!.date.toDate
                    ? (billSale()!.date.toDate() | date: 'medium')
                    : billSale()!.date
                }}
              </div>
            }
          </div>

          @if (billItemsLoading()) {
            <div class="text-xs text-gray-400 text-center py-4">Loading items…</div>
          } @else {
            <table class="w-full text-sm mb-3">
              <thead>
                <tr class="border-b border-gray-200 text-gray-500 text-xs">
                  <th class="text-left py-1">Item</th>
                  <th class="text-right py-1">Qty</th>
                  <th class="text-right py-1">Price</th>
                  <th class="text-right py-1">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @for (item of billItems(); track item.id) {
                  <tr class="border-b border-gray-100">
                    <td class="py-1">{{ item.productName }}</td>
                    <td class="py-1 text-right">{{ item.quantity }}</td>
                    <td class="py-1 text-right">Rs {{ item.salePrice | number }}</td>
                    <td class="py-1 text-right">
                      Rs {{ item.quantity * item.salePrice | number }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="py-2 text-center text-gray-400 text-xs">
                      No item detail found for this sale.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }

          <div class="flex justify-between font-semibold text-sm border-t border-gray-200 pt-2">
            <span>Total</span>
            <span>Rs {{ billSale()!.totalAmount | number }}</span>
          </div>

          <div class="text-center text-xs text-gray-400 mt-4">Thank you for your business</div>

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
export class SalesComponent {
  shop = SHOP_INFO;
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private categoryService = inject(CategoryService);
  private modelService = inject(ModelService);
  private typeService = inject(TypeService);
  private lotService = inject(LotService);
  private saleService = inject(SaleService);

  products = signal<Product[]>([]);
  customers = signal<Customer[]>([]);
  categories = signal<Category[]>([]);
  models = signal<CarModel[]>([]);
  types = signal<ProductType[]>([]);
  sales = signal<Sale[]>([]);
  availableLots = signal<Lot[]>([]);
  cart = signal<CartLine[]>([]);

  billSale = signal<Sale | null>(null);
  billItems = signal<any[]>([]);
  billItemsLoading = signal(false);

  customerId = '';
  categoryFilter = '';
  modelFilter = '';
  typeFilter = '';
  selectedProductId = '';
  qtyInputs: Record<string, number> = {};
  priceInputs: Record<string, number> = {};
  isSubmitting = false;

  constructor() {
    this.productService.list().subscribe((l) => this.products.set(l));
    this.customerService.list().subscribe((l) => this.customers.set(l));
    this.categoryService.list().subscribe((l) => this.categories.set(l));
    this.modelService.list().subscribe((l) => this.models.set(l));
    this.typeService.list().subscribe((l) => this.types.set(l));
    this.saleService.list().subscribe((l) => this.sales.set(l));
  }

  filteredProducts() {
    return this.products().filter(
      (p) =>
        (!this.categoryFilter || p.category === this.categoryFilter) &&
        (!this.modelFilter || p.model === this.modelFilter) &&
        (!this.typeFilter || p.type === this.typeFilter),
    );
  }

  onProductPick(productId: string) {
    this.lotService
      .listAvailableForProduct(productId)
      .subscribe((lots) => this.availableLots.set(lots));
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
    this.cart.update((c) => [
      ...c,
      {
        lotId: lot.id!,
        productId: lot.productId,
        productName: lot.productName,
        quantity: qty,
        salePrice: price,
        lotLabel: `Lot ${lot.id!.slice(0, 6)}`,
        maxQty: lot.quantityRemaining,
      },
    ]);
    this.qtyInputs[lot.id!] = 0;
    this.priceInputs[lot.id!] = 0;
  }

  removeFromCart(i: number) {
    this.cart.update((c) => c.filter((_, idx) => idx !== i));
  }

  cartTotal() {
    return this.cart().reduce((sum, l) => sum + l.quantity * l.salePrice, 0);
  }

  openBill(sale: Sale) {
    this.billSale.set(sale);
    this.billItems.set([]);
    this.billItemsLoading.set(true);
    this.saleService.listItemsForSale(sale.id!).subscribe((items) => {
      this.billItems.set(items);
      this.billItemsLoading.set(false);
    });
  }

  closeBill() {
    this.billSale.set(null);
    this.billItems.set([]);
  }

  async submitSale() {
    this.isSubmitting = true;
    const customer = this.customers().find((c) => c.id === this.customerId);
    try {
      await this.saleService.recordSale(
        this.customerId || null,
        customer?.name ?? 'Walk-in',
        this.cart(),
      );
      this.cart.set([]);
      this.selectedProductId = '';
      this.availableLots.set([]);
      this.categoryFilter = '';
      this.modelFilter = '';
      this.typeFilter = '';
    } catch (err: any) {
      alert(err.message ?? 'Sale failed — stock may have changed, please retry.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
