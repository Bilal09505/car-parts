import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SupplierService } from '../../core/services/supplier.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { SupplierPaymentService } from '../../core/services/supplier-payment.service';
import { Supplier, Purchase, SupplierPayment } from '../../core/models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-800">Suppliers</h1>
      <button (click)="openAddForm()" class="bg-orange-600 text-white text-sm px-3 py-2 rounded">
        {{ showForm() ? 'Cancel' : '+ Add Supplier' }}
      </button>
    </div>

    @if (showForm()) {
      <form (ngSubmit)="save()" class="bg-gray-50 border border-gray-200 rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input [(ngModel)]="form.name" name="name" placeholder="Supplier name" required class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.phone" name="phone" placeholder="Phone" class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.address" name="address" placeholder="Address" class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.balance" name="balance" type="number" placeholder="Opening balance" [disabled]="!!editingId()" class="border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400" />
        <button type="submit" class="bg-blue-600 text-white text-sm px-3 py-2 rounded md:col-span-3">
          {{ editingId() ? 'Update Supplier' : 'Save Supplier' }}
        </button>
      </form>
    }

    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr>
            <th class="px-3 py-2 text-left">Name</th>
            <th class="px-3 py-2 text-left">Phone</th>
            <th class="px-3 py-2 text-left">Address</th>
            <th class="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          @for (s of suppliers(); track s.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ s.name }}</td>
              <td class="px-3 py-2">{{ s.phone }}</td>
              <td class="px-3 py-2">{{ s.address }}</td>              
              <td class="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button (click)="openEditForm(s)" class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded">
                  Edit
                </button>
                <button (click)="openView(s)" class="bg-slate-700 text-white text-xs px-3 py-1.5 rounded">
                  View
                </button>
                <button (click)="openPayModal(s)" class="bg-green-600 text-white text-xs px-3 py-1.5 rounded">
                  Pay
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="px-3 py-4 text-center text-gray-400 text-xs">No suppliers yet.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (viewSupplier(); as vs) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" (click)="closeView()">
        <div class="bg-white rounded shadow-lg w-full max-w-2xl p-5" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-slate-800 text-sm">Supplier Details</h2>
            <button (click)="closeView()" class="text-gray-500 text-lg leading-none">✕</button>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <div><span class="text-gray-500">Name:</span> {{ vs.name }}</div>
            <div><span class="text-gray-500">Phone:</span> {{ vs.phone || '—' }}</div>
            <div><span class="text-gray-500">Address:</span> {{ vs.address || '—' }}</div>
            <div><span class="text-gray-500">Balance We Owe:</span> Rs {{ totalOwed(vs) | number }}</div>
          </div>

          <h3 class="text-xs font-semibold text-gray-500 mb-2">Purchase History</h3>
          <div class="max-h-40 overflow-auto border border-gray-200 rounded mb-4">
            <table class="w-full text-xs">
              <thead class="bg-gray-100 sticky top-0">
                <tr>
                  <th class="px-2 py-1.5 text-left">Date</th>
                  <th class="px-2 py-1.5 text-right">Items</th>
                  <th class="px-2 py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (purchase of supplierPurchases(); track purchase.id) {
                  <tr class="border-t border-gray-100">
                    <td class="px-2 py-1.5">
                      {{
                        purchase.date?.toDate
                          ? (purchase.date.toDate() | date: 'd MMM y, h:mm a')
                          : (purchase.date | date: 'd MMM y, h:mm a')
                      }}
                    </td>
                    <td class="px-2 py-1.5 text-right">{{ purchase.items?.length || 0 }}</td>
                    <td class="px-2 py-1.5 text-right">Rs {{ purchase.totalCost | number }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="px-2 py-3 text-center text-gray-400">No purchases yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <h3 class="text-xs font-semibold text-gray-500 mb-2">Payment History</h3>
          <div class="max-h-40 overflow-auto border border-gray-200 rounded mb-4">
            <table class="w-full text-xs">
              <thead class="bg-gray-100 sticky top-0">
                <tr>
                  <th class="px-2 py-1.5 text-left">Date</th>
                  <th class="px-2 py-1.5 text-left">Source</th>
                  <th class="px-2 py-1.5 text-left">Detail</th>
                  <th class="px-2 py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (p of supplierPayments(); track p.id) {
                  <tr class="border-t border-gray-100">
                    <td class="px-2 py-1.5">
                      {{
                        p.date?.toDate
                          ? (p.date.toDate() | date: 'd MMM y, h:mm a')
                          : (p.date | date: 'd MMM y, h:mm a')
                      }}
                    </td>
                    <td class="px-2 py-1.5">{{ p.source }}</td>
                    <td class="px-2 py-1.5">{{ p.detail || '—' }}</td>
                    <td class="px-2 py-1.5 text-right">Rs {{ p.amount | number }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-2 py-3 text-center text-gray-400">No payments yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <button (click)="closeView()" class="bg-slate-800 text-white text-sm px-3 py-2 rounded w-full">
            Close
          </button>
        </div>
      </div>
    }

    @if (payingSupplier(); as ps) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" (click)="closePayModal()">
        <div class="bg-white rounded shadow-lg w-full max-w-sm p-5" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-slate-800 text-sm">Pay {{ ps.name }}</h2>
            <button (click)="closePayModal()" class="text-gray-500 text-lg leading-none">✕</button>
          </div>

          <form (ngSubmit)="savePayment()" class="space-y-3">
            <input [(ngModel)]="paymentForm.amount" name="amount" type="number" placeholder="Amount" required class="border rounded px-3 py-2 text-sm w-full" />
            <input [(ngModel)]="paymentForm.source" name="source" placeholder="Source / Bank name" required class="border rounded px-3 py-2 text-sm w-full" />
            <input [(ngModel)]="paymentForm.detail" name="detail" placeholder="Detail (optional)" class="border rounded px-3 py-2 text-sm w-full" />
            <button type="submit" class="bg-green-600 text-white text-sm px-3 py-2 rounded w-full">
              Save Payment
            </button>
          </form>
        </div>
      </div>
    }
  `,
})
export class SuppliersComponent {
  private supplierService = inject(SupplierService);
  private purchaseService = inject(PurchaseService);
  private paymentService = inject(SupplierPaymentService);

  suppliers = signal<Supplier[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  viewSupplier = signal<Supplier | null>(null);
  supplierPurchases = signal<Purchase[]>([]);
  supplierPayments = signal<SupplierPayment[]>([]);
  payingSupplier = signal<Supplier | null>(null);

  private purchasesSub?: Subscription;
  private paymentsSub?: Subscription;

  form: Partial<Supplier> = { name: '', phone: '', address: '', balance: 0 };
  paymentForm: Partial<SupplierPayment> = { amount: 0, source: '', detail: '' };

  constructor() {
    this.supplierService.list().subscribe((list) => this.suppliers.set(list));
  }

  openAddForm() {
    if (this.showForm() && !this.editingId()) {
      this.showForm.set(false);
      return;
    }
    this.editingId.set(null);
    this.form = { name: '', phone: '', address: '', balance: 0 };
    this.showForm.set(true);
  }

  openEditForm(s: Supplier) {
    this.editingId.set(s.id ?? null);
    this.form = { name: s.name, phone: s.phone, address: s.address, balance: s.balance ?? 0 };
    this.showForm.set(true);
  }

  openView(s: Supplier) {
    this.viewSupplier.set(s);
    this.purchasesSub?.unsubscribe();
    this.paymentsSub?.unsubscribe();
    if (s.id) {
      this.purchasesSub = this.purchaseService
        .purchasesForSupplier(s.id)
        .subscribe((purchases) => this.supplierPurchases.set(purchases));
      this.paymentsSub = this.paymentService
        .paymentsForSupplier(s.id)
        .subscribe((payments) => this.supplierPayments.set(payments));
    }
  }

  // Net owed = opening balance + total purchased - total paid.
  // Assumes `balance` is a static opening figure set once at creation and
  // never mutated elsewhere. If something else writes to balance on
  // purchase/payment, this will double-count — verify before trusting it.
  totalOwed(s: Supplier): number {
    const purchaseTotal = this.supplierPurchases().reduce(
      (sum, p) => sum + (p.totalCost || 0),
      0,
    );
    const paidTotal = this.supplierPayments().reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );
    return (s.balance || 0) + purchaseTotal - paidTotal;
  }

  closeView() {
    this.viewSupplier.set(null);
    this.purchasesSub?.unsubscribe();
    this.paymentsSub?.unsubscribe();
    this.supplierPurchases.set([]);
    this.supplierPayments.set([]);
  }

  openPayModal(s: Supplier) {
    this.paymentForm = { amount: 0, source: '', detail: '' };
    this.payingSupplier.set(s);
  }

  closePayModal() {
    this.payingSupplier.set(null);
  }

  async savePayment() {
    const supplier = this.payingSupplier();
    if (!supplier?.id || !this.paymentForm.amount || !this.paymentForm.source) return;

    await this.paymentService.add({
      supplierId: supplier.id,
      amount: Number(this.paymentForm.amount) || 0,
      source: this.paymentForm.source,
      detail: this.paymentForm.detail || '',
    });

    // Refresh history if the view modal for this supplier happens to be open.
    if (this.viewSupplier()?.id === supplier.id) {
      this.openView(supplier);
    }

    this.closePayModal();
  }

  async save() {
    if (!this.form.name) return;

    const payload: Partial<Supplier> = {
      ...this.form,
      balance: Number(this.form.balance) || 0,
    };

    const id = this.editingId();
    if (id) {
      await this.supplierService.update(id, payload);
    } else {
      await this.supplierService.add(payload as Omit<Supplier, 'id'>);
    }

    this.form = { name: '', phone: '', address: '', balance: 0 };
    this.editingId.set(null);
    this.showForm.set(false);
  }
}