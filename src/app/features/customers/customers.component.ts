import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CustomerService } from '../../core/services/customer.service';
import { SaleService } from '../../core/services/sale.service';
import { Customer, Sale } from '../../core/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-800">Customers</h1>
      <button (click)="openAddForm()" class="bg-orange-600 text-white text-sm px-3 py-2 rounded">
        {{ showForm() ? 'Cancel' : '+ Add Customer' }}
      </button>
    </div>

    @if (showForm()) {
      <form
        (ngSubmit)="save()"
        class="bg-gray-50 border border-gray-200 rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <input
          [(ngModel)]="form.name"
          name="name"
          placeholder="Customer name"
          required
          class="border rounded px-3 py-2 text-sm"
        />
        <input
          [(ngModel)]="form.phone"
          name="phone"
          placeholder="Phone"
          class="border rounded px-3 py-2 text-sm"
        />
        <input
          [(ngModel)]="form.address"
          name="address"
          placeholder="Address"
          class="border rounded px-3 py-2 text-sm"
        />
        <input
          [(ngModel)]="form.balance"
          name="balance"
          type="number"
          placeholder="Opening balance"
          [disabled]="!!editingId()"
          class="border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
        />
        <button
          type="submit"
          class="bg-blue-600 text-white text-sm px-3 py-2 rounded md:col-span-3"
        >
          {{ editingId() ? 'Update Customer' : 'Save Customer' }}
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
          @for (c of customers(); track c.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ c.name }}</td>
              <td class="px-3 py-2">{{ c.phone }}</td>
              <td class="px-3 py-2">{{ c.address }}</td>
              <td class="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button
                  (click)="openEditForm(c)"
                  class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded"
                >
                  Edit
                </button>
                <button
                  (click)="openView(c)"
                  class="bg-slate-700 text-white text-xs px-3 py-1.5 rounded"
                >
                  View
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="px-3 py-4 text-center text-gray-400 text-xs">
                No customers yet.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (viewCustomer(); as vc) {
      <div
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        (click)="closeView()"
      >
        <div
          class="bg-white rounded shadow-lg w-full max-w-sm p-5"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-slate-800 text-sm">Customer Details</h2>
            <button (click)="closeView()" class="text-gray-500 text-lg leading-none">✕</button>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <div><span class="text-gray-500">Name:</span> {{ vc.name }}</div>
            <div><span class="text-gray-500">Phone:</span> {{ vc.phone || '—' }}</div>
            <div><span class="text-gray-500">Address:</span> {{ vc.address || '—' }}</div>
            <div>
              <span class="text-gray-500">Balance Owed:</span> Rs {{ vc.balance || 0 | number }}
            </div>
          </div>

          <h3 class="text-xs font-semibold text-gray-500 mb-2">Sales History</h3>
          <div class="max-h-56 overflow-auto border border-gray-200 rounded mb-4">
            <table class="w-full text-xs">
              <thead class="bg-gray-100 sticky top-0">
                <tr>
                  <th class="px-2 py-1.5 text-left">Date</th>
                  <th class="px-2 py-1.5 text-right">Items</th>
                  <th class="px-2 py-1.5 text-right">Total</th>
                  <th class="px-2 py-1.5 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                @for (sale of customerSales(); track sale.id) {
                  <tr class="border-t border-gray-100">
                    <td class="px-2 py-1.5">
                      {{
                        sale.date?.toDate
                          ? (sale.date.toDate() | date: 'd MMM y, h:mm a')
                          : (sale.date | date: 'd MMM y, h:mm a')
                      }}
                    </td>
                    <td class="px-2 py-1.5 text-right">{{ sale.itemCount }}</td>
                    <td class="px-2 py-1.5 text-right">Rs {{ sale.totalAmount | number }}</td>
                    <td class="px-2 py-1.5 text-right">Rs {{ sale.totalProfit | number }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-2 py-3 text-center text-gray-400">No sales yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <button
            (click)="closeView()"
            class="bg-slate-800 text-white text-sm px-3 py-2 rounded w-full"
          >
            Close
          </button>
        </div>
      </div>
    }
  `,
})
export class CustomersComponent {
  private customerService = inject(CustomerService);
  private saleService = inject(SaleService);
  customers = signal<Customer[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  viewCustomer = signal<Customer | null>(null);
  customerSales = signal<Sale[]>([]);
  private salesSub?: Subscription;

  form: Partial<Customer> = { name: '', phone: '', address: '', balance: 0 };

  constructor() {
    this.customerService.list().subscribe((list) => this.customers.set(list));
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

  openEditForm(c: Customer) {
    this.editingId.set(c.id ?? null);
    this.form = { name: c.name, phone: c.phone, address: c.address, balance: c.balance ?? 0 };
    this.showForm.set(true);
  }

  openView(c: Customer) {
    this.viewCustomer.set(c);
    this.salesSub?.unsubscribe();
    if (c.id) {
      this.salesSub = this.saleService
        .salesForCustomer(c.id)
        .subscribe((sales) => this.customerSales.set(sales));
    }
  }

  closeView() {
    this.viewCustomer.set(null);
    this.salesSub?.unsubscribe();
    this.customerSales.set([]);
  }

  async save() {
    if (!this.form.name) return;

    // ngModel on a number input can yield null/undefined if the field is
    // cleared, so coerce explicitly rather than trusting the form's type.
    const payload: Partial<Customer> = {
      ...this.form,
      balance: Number(this.form.balance) || 0,
    };

    const id = this.editingId();
    if (id) {
      // Assumes CustomerService has update(id, data). Adjust if your
      // service method name/signature differs.
      await this.customerService.update(id, payload);
    } else {
      await this.customerService.add(payload as Omit<Customer, 'id'>);
    }

    this.form = { name: '', phone: '', address: '', balance: 0 };
    this.editingId.set(null);
    this.showForm.set(false);
  }
}
