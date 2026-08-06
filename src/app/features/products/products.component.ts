import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { Product, Category } from '../../core/models';
import { CategoryModalComponent } from './category-modal.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryModalComponent],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-800">Products</h1>
      <button (click)="showForm.set(!showForm())" class="bg-orange-600 text-white text-sm px-3 py-2 rounded">
        {{ showForm() ? 'Cancel' : '+ Add Product' }}
      </button>
    </div>

    @if (showForm()) {
      <form (ngSubmit)="save()" class="bg-gray-50 border border-gray-200 rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input [(ngModel)]="form.name" name="name" placeholder="Part name (e.g. Front Bumper)" required
               class="border rounded px-3 py-2 text-sm" />

        <div class="flex gap-2">
          <select [(ngModel)]="form.category" name="category" class="border rounded px-3 py-2 text-sm flex-1">
            <option value="" disabled selected>Select category…</option>
            @for (c of categories(); track c.id) {
              <option [value]="c.name">{{ c.name }}</option>
            }
          </select>
          <button type="button" (click)="showCategoryModal.set(true)"
                  class="bg-slate-800 text-white text-xs px-2 rounded shrink-0" title="Add / manage categories">
            + Category
          </button>
        </div>

        <input [(ngModel)]="form.vehicleModel" name="vehicleModel" placeholder="Vehicle (e.g. Toyota Corolla)"
               class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.unit" name="unit" placeholder="Unit (pcs)" class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.reorderLevel" name="reorderLevel" type="number" placeholder="Reorder level"
               class="border rounded px-3 py-2 text-sm" />
        <input [(ngModel)]="form.currentSalePrice" name="currentSalePrice" type="number" placeholder="Default sale price"
               class="border rounded px-3 py-2 text-sm" />
        <button type="submit" [disabled]="isSubmitting" class="bg-blue-600 text-white text-sm px-3 py-2 rounded md:col-span-3">
          {{ isSubmitting ? 'Saving...' : 'Save Product' }}
        </button>
      </form>
    }

    <div class="overflow-x-auto border border-gray-200 rounded">
      <table class="w-full text-sm">
        <thead class="bg-slate-900 text-white">
          <tr>
            <th class="px-3 py-2 text-left">Name</th>
            <th class="px-3 py-2 text-left">Vehicle</th>
            <th class="px-3 py-2 text-left">Category</th>
            <th class="px-3 py-2 text-right">Reorder Lvl</th>
            <th class="px-3 py-2 text-right">Sale Price</th>
          </tr>
        </thead>
        <tbody>
          @for (p of products(); track p.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ p.name }}</td>
              <td class="px-3 py-2">{{ p.vehicleModel }}</td>
              <td class="px-3 py-2">{{ p.category }}</td>
              <td class="px-3 py-2 text-right">{{ p.reorderLevel }}</td>
              <td class="px-3 py-2 text-right">Rs {{ p.currentSalePrice | number }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (showCategoryModal()) {
      <app-category-modal (close)="showCategoryModal.set(false)" />
    }
  `,
})
export class ProductsComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isSubmitting = false;
  showForm = signal(false);
  showCategoryModal = signal(false);
  form: Partial<Product> = { name: '', category: '', vehicleModel: '', unit: 'pcs', reorderLevel: 5, currentSalePrice: 0 };

  constructor() {
    this.productService.list().subscribe((list) => this.products.set(list));
    this.categoryService.list().subscribe((list) => this.categories.set(list));
  }

  async save() {
    if (!this.form.name) return;

    this.isSubmitting = true;
    try {
      await this.productService.add(this.form as Omit<Product, 'id'>);
      this.form = { name: '', category: '', vehicleModel: '', unit: 'pcs', reorderLevel: 5, currentSalePrice: 0 };
      this.showForm.set(false);
    } finally {
      this.isSubmitting = false;
    }
  }
}