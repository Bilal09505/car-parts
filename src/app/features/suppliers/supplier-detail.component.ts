import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierService } from '../../core/services/supplier.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { SupplierPaymentService } from '../../core/services/supplier-payment.service';
import { Supplier, Purchase, SupplierPayment } from '../../core/models';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (supplier(); as sup) {
      <div class="max-w-3xl mx-auto p-4">
        <div class="flex items-center justify-between mb-4">
          <h1 class="font-bold text-slate-800 text-lg">{{ sup.name }}</h1>
          <button (click)="router.navigate(['/suppliers'])" class="text-sm text-slate-600 underline">
            ← Back to Suppliers
          </button>
        </div>

        <div class="space-y-1 text-sm mb-6 bg-gray-50 border border-gray-200 rounded p-4">
          <div><span class="text-gray-500">Phone:</span> {{ sup.phone || '—' }}</div>
          <div><span class="text-gray-500">Address:</span> {{ sup.address || '—' }}</div>
          <div><span class="text-gray-500">Balance We Owe:</span> Rs {{ totalOwed() | number }}</div>
        </div>

        <!-- PURCHASE HISTORY -->
        <div class="print-purchases-area mb-8">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-700">Purchase History</h3>
            <button (click)="printSection('purchases')" class="no-print bg-slate-700 text-white text-xs px-3 py-1.5 rounded">
              Print
            </button>
          </div>
          <div class="overflow-auto border border-gray-200 rounded">
            <table class="w-full text-xs">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-2 py-1.5 text-left">Date</th>
                  <th class="px-2 py-1.5 text-right">Items</th>
                  <th class="px-2 py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (purchase of purchases(); track purchase.id) {
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
                  <tr><td colspan="3" class="px-2 py-3 text-center text-gray-400">No purchases yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- PAYMENT HISTORY -->
        <div class="print-payments-area">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-700">Payment History</h3>
            <div class="no-print flex gap-2">
              <button (click)="showPayForm.set(!showPayForm())" class="bg-green-600 text-white text-xs px-3 py-1.5 rounded">
                {{ showPayForm() ? 'Cancel' : '+ Record Payment' }}
              </button>
              <button (click)="printSection('payments')" class="bg-slate-700 text-white text-xs px-3 py-1.5 rounded">
                Print
              </button>
            </div>
          </div>

          @if (showPayForm()) {
            <div class="no-print bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <form (ngSubmit)="savePayment()" class="space-y-2">
                <input [(ngModel)]="paymentForm.amount" name="amount" type="number" placeholder="Amount" required class="border rounded px-3 py-2 text-sm w-full" />
                <input [(ngModel)]="paymentForm.source" name="source" placeholder="Source / Bank name" required class="border rounded px-3 py-2 text-sm w-full" />
                <input [(ngModel)]="paymentForm.detail" name="detail" placeholder="Detail (optional)" class="border rounded px-3 py-2 text-sm w-full" />
                <div class="flex gap-2">
                  <button type="submit" class="bg-green-600 text-white text-sm px-3 py-2 rounded flex-1">
                    {{ editingPaymentId() ? 'Update Payment' : 'Save Payment' }}
                  </button>
                  <button type="button" (click)="cancelPaymentForm()" class="bg-gray-300 text-slate-800 text-sm px-3 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          }

          <div class="overflow-auto border border-gray-200 rounded">
            <table class="w-full text-xs">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-2 py-1.5 text-left">Date</th>
                  <th class="px-2 py-1.5 text-left">Source</th>
                  <th class="px-2 py-1.5 text-left">Detail</th>
                  <th class="px-2 py-1.5 text-right">Amount</th>
                  <th class="no-print px-2 py-1.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (p of payments(); track p.id) {
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
                    <td class="no-print px-2 py-1.5 text-right">
                      <button (click)="editPayment(p)" class="text-blue-600 text-xs underline">Edit</button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="px-2 py-3 text-center text-gray-400">No payments yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    } @else {
      <div class="p-8 text-center text-gray-400 text-sm">
        {{ notFound() ? 'Supplier not found.' : 'Loading…' }}
      </div>
    }
  `,
})
export class SupplierDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private supplierService = inject(SupplierService);
  private purchaseService = inject(PurchaseService);
  private paymentService = inject(SupplierPaymentService);

  supplier = signal<Supplier | null>(null);
  notFound = signal(false);
  purchases = signal<Purchase[]>([]);
  payments = signal<SupplierPayment[]>([]);
  showPayForm = signal(false);
  editingPaymentId = signal<string | null>(null);

  paymentForm: Partial<SupplierPayment> = { amount: 0, source: '', detail: '' };

  private supplierSub?: Subscription;
  private purchasesSub?: Subscription;
  private paymentsSub?: Subscription;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      return;
    }

    this.supplierSub = this.supplierService.getById(id).subscribe((sup) => {
      if (!sup) {
        this.notFound.set(true);
        return;
      }
      this.supplier.set(sup);
    });

    this.purchasesSub = this.purchaseService
      .purchasesForSupplier(id)
      .subscribe((list) => this.purchases.set(list));

    this.paymentsSub = this.paymentService
      .paymentsForSupplier(id)
      .subscribe((list) => this.payments.set(list));

    window.addEventListener('afterprint', this.clearPrintClass);
  }

  ngOnDestroy() {
    this.supplierSub?.unsubscribe();
    this.purchasesSub?.unsubscribe();
    this.paymentsSub?.unsubscribe();
    window.removeEventListener('afterprint', this.clearPrintClass);
    this.clearPrintClass();
  }

  totalOwed(): number {
    const sup = this.supplier();
    if (!sup) return 0;
    const purchaseTotal = this.purchases().reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const paidTotal = this.payments().reduce((sum, p) => sum + (p.amount || 0), 0);
    return (sup.balance || 0) + purchaseTotal - paidTotal;
  }

  editPayment(p: SupplierPayment) {
    this.editingPaymentId.set(p.id ?? null);
    this.paymentForm = { amount: p.amount, source: p.source, detail: p.detail };
    this.showPayForm.set(true);
  }

  cancelPaymentForm() {
    this.showPayForm.set(false);
    this.editingPaymentId.set(null);
    this.paymentForm = { amount: 0, source: '', detail: '' };
  }

  async savePayment() {
    const sup = this.supplier();
    if (!sup?.id || !this.paymentForm.amount || !this.paymentForm.source) return;

    const editId = this.editingPaymentId();
    if (editId) {
      await this.paymentService.update(editId, {
        amount: Number(this.paymentForm.amount) || 0,
        source: this.paymentForm.source,
        detail: this.paymentForm.detail || '',
      });
    } else {
      await this.paymentService.add({
        supplierId: sup.id,
        amount: Number(this.paymentForm.amount) || 0,
        source: this.paymentForm.source,
        detail: this.paymentForm.detail || '',
      });
    }

    this.cancelPaymentForm();
  }

  printSection(section: 'purchases' | 'payments') {
    document.body.classList.add(`print-${section}`);
    setTimeout(() => window.print(), 50);
  }

  private clearPrintClass = () => {
    document.body.classList.remove('print-purchases', 'print-payments');
  };
}