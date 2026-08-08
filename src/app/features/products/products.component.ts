import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ModelService } from '../../core/services/model.service';
import { TypeService } from '../../core/services/type.service';
import { Product, Category, CarModel, ProductType } from '../../core/models';
import { CategoryModalComponent } from './category-modal.component';
import { ModelModalComponent } from './model-modal.component';
import { TypeModalComponent } from './type-modal.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryModalComponent, ModelModalComponent, TypeModalComponent],
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

        <div class="flex gap-2">
          <select [(ngModel)]="form.model" name="model" class="border rounded px-3 py-2 text-sm flex-1">
            <option value="" disabled selected>Select model…</option>
            @for (m of models(); track m.id) {
              <option [value]="m.name">{{ m.name }}</option>
            }
          </select>
          <button type="button" (click)="showModelModal.set(true)"
                  class="bg-slate-800 text-white text-xs px-2 rounded shrink-0" title="Add / manage models">
            + Model
          </button>
        </div>

        <div class="flex gap-2">
          <select [(ngModel)]="form.type" name="type" class="border rounded px-3 py-2 text-sm flex-1">
            <option value="" disabled selected>Select type…</option>
            @for (t of types(); track t.id) {
              <option [value]="t.name">{{ t.name }}</option>
            }
          </select>
          <button type="button" (click)="showTypeModal.set(true)"
                  class="bg-slate-800 text-white text-xs px-2 rounded shrink-0" title="Add / manage types">
            + Type
          </button>
        </div>

        <input [(ngModel)]="form.vehicleModel" name="vehicleModel" placeholder="Vehicle (e.g. Toyota Corolla)"
               class="border rounded px-3 py-2 text-sm" />

        <select [(ngModel)]="form.unit" name="unit" class="border rounded px-3 py-2 text-sm">
          <option value="pcs">Pcs</option>
          <option value="set">Set</option>
        </select>

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
            <th class="px-3 py-2 text-left">Model</th>
            <th class="px-3 py-2 text-left">Type</th>
            <th class="px-3 py-2 text-left">Unit</th>
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
              <td class="px-3 py-2">{{ p.model }}</td>
              <td class="px-3 py-2">{{ p.type }}</td>
              <td class="px-3 py-2">{{ p.unit }}</td>
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
    @if (showModelModal()) {
      <app-model-modal (close)="showModelModal.set(false)" />
    }
    @if (showTypeModal()) {
      <app-type-modal (close)="showTypeModal.set(false)" />
    }
  `,
})
export class ProductsComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private modelService = inject(ModelService);
  private typeService = inject(TypeService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  models = signal<CarModel[]>([]);
  types = signal<ProductType[]>([]);

  isSubmitting = false;
  showForm = signal(false);
  showCategoryModal = signal(false);
  showModelModal = signal(false);
  showTypeModal = signal(false);

  form: Partial<Product> = {
    name: '', category: '', model: '', type: '', vehicleModel: '',
    unit: 'pcs', reorderLevel: 5, currentSalePrice: 0,
  };

  constructor() {
    this.productService.list().subscribe((list) => this.products.set(list));
    this.categoryService.list().subscribe((list) => this.categories.set(list));
    this.modelService.list().subscribe((list) => this.models.set(list));
    this.typeService.list().subscribe((list) => this.types.set(list));
  }

  async save() {
    if (!this.form.name) return;

    this.isSubmitting = true;
    try {
      await this.productService.add(this.form as Omit<Product, 'id'>);
      this.form = {
        name: '', category: '', model: '', type: '', vehicleModel: '',
        unit: 'pcs', reorderLevel: 5, currentSalePrice: 0,
      };
      this.showForm.set(false);
    } finally {
      this.isSubmitting = false;
    }
  }
}