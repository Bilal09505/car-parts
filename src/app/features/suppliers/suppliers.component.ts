import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../core/services/supplier.service';
import { Supplier } from '../../core/models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-800">Suppliers</h1>
      <button (click)="showForm.set(!showForm())" class="bg-orange-600 text-white text-sm px-3 py-2 rounded">
        {{ showForm() ? 'Cancel' : '+ Add Supplier' }}
      </button>
    </div>

    @if (showForm()) {
      <form (ngSubmit)="save()" class="bg-gray-50 border border-gray-200 rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input [(ngModel)]="form.name" name="name" placeholder="Supplier name" required class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.phone" name="phone" placeholder="Phone" class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.address" name="address" placeholder="Address" class="border rounded px-3 py-2 text-sm" />
        <button type="submit" class="bg-blue-600 text-white text-sm px-3 py-2 rounded md:col-span-3">Save Supplier</button>
      </form>
    }

    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr>
            <th class="px-3 py-2 text-left">Name</th>
            <th class="px-3 py-2 text-left">Phone</th>
            <th class="px-3 py-2 text-left">Address</th>
            <th class="px-3 py-2 text-right">Balance We Owe</th>
          </tr>
        </thead>
        <tbody>
          @for (s of suppliers(); track s.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ s.name }}</td>
              <td class="px-3 py-2">{{ s.phone }}</td>
              <td class="px-3 py-2">{{ s.address }}</td>
              <td class="px-3 py-2 text-right">Rs {{ (s.balance || 0) | number }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class SuppliersComponent {
  private supplierService = inject(SupplierService);
  suppliers = signal<Supplier[]>([]);
  showForm = signal(false);
  form: Partial<Supplier> = { name: '', phone: '', address: '', balance: 0 };

  constructor() {
    this.supplierService.list().subscribe((list) => this.suppliers.set(list));
  }

  async save() {
    if (!this.form.name) return;
    await this.supplierService.add(this.form as Omit<Supplier, 'id'>);
    this.form = { name: '', phone: '', address: '', balance: 0 };
    this.showForm.set(false);
  }
}
