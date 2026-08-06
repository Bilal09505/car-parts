import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { Customer } from '../../core/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-800">Customers</h1>
      <button (click)="showForm.set(!showForm())" class="bg-orange-600 text-white text-sm px-3 py-2 rounded">
        {{ showForm() ? 'Cancel' : '+ Add Customer' }}
      </button>
    </div>

    @if (showForm()) {
      <form (ngSubmit)="save()" class="bg-gray-50 border border-gray-200 rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input [(ngModel)]="form.name" name="name" placeholder="Customer name" required class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.phone" name="phone" placeholder="Phone" class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.address" name="address" placeholder="Address" class="border rounded px-3 py-2 text-sm" />
        <button type="submit" class="bg-blue-600 text-white text-sm px-3 py-2 rounded md:col-span-3">Save Customer</button>
      </form>
    }

    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr>
            <th class="px-3 py-2 text-left">Name</th>
            <th class="px-3 py-2 text-left">Phone</th>
            <th class="px-3 py-2 text-left">Address</th>
            <th class="px-3 py-2 text-right">Balance Owed</th>
          </tr>
        </thead>
        <tbody>
          @for (c of customers(); track c.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ c.name }}</td>
              <td class="px-3 py-2">{{ c.phone }}</td>
              <td class="px-3 py-2">{{ c.address }}</td>
              <td class="px-3 py-2 text-right">Rs {{ (c.balance || 0) | number }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CustomersComponent {
  private customerService = inject(CustomerService);
  customers = signal<Customer[]>([]);
  showForm = signal(false);
  form: Partial<Customer> = { name: '', phone: '', address: '', balance: 0 };

  constructor() {
    this.customerService.list().subscribe((list) => this.customers.set(list));
  }

  async save() {
    if (!this.form.name) return;
    await this.customerService.add(this.form as Omit<Customer, 'id'>);
    this.form = { name: '', phone: '', address: '', balance: 0 };
    this.showForm.set(false);
  }
}
