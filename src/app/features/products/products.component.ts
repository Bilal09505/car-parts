import { Component, computed, inject, signal } from '@angular/core';
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
import { PaginationComponent } from '../../core/shared/pagination';
import { SearchInputComponent } from '../../core/shared/search-input.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CategoryModalComponent,
    ModelModalComponent,
    TypeModalComponent,
    PaginationComponent,
    SearchInputComponent,
  ],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-800">Products</h1>
      <button (click)="openAddForm()" class="bg-orange-600 text-white text-sm px-3 py-2 rounded">
        {{ showForm() ? 'Cancel' : '+ Add Product' }}
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
          placeholder="Part name (e.g. Front Bumper)"
          required
          class="border rounded px-3 py-2 text-sm"
        />

        <div class="flex gap-2">
          <select
            [(ngModel)]="form.category"
            name="category"
            required
            class="border rounded px-3 py-2 text-sm flex-1"
          >
            <option value="" disabled selected>Select category…</option>
            @for (c of categories(); track c.id) {
              <option [value]="c.name">{{ c.name }}</option>
            }
          </select>
          <button
            type="button"
            (click)="showCategoryModal.set(true)"
            class="bg-slate-800 text-white text-xs px-2 rounded shrink-0"
            title="Add / manage categories"
          >
            + Category
          </button>
        </div>

        <div class="flex gap-2">
          <select
            [(ngModel)]="form.model"
            name="model"
            required
            class="border rounded px-3 py-2 text-sm flex-1"
          >
            <option value="" disabled selected>Select model…</option>
            @for (m of models(); track m.id) {
              <option [value]="m.name">{{ m.name }}</option>
            }
          </select>
          <button
            type="button"
            (click)="showModelModal.set(true)"
            class="bg-slate-800 text-white text-xs px-2 rounded shrink-0"
            title="Add / manage models"
          >
            + Model
          </button>
        </div>

        <div class="flex gap-2">
          <select
            [(ngModel)]="form.type"
            name="type"
            required
            class="border rounded px-3 py-2 text-sm flex-1"
          >
            <option value="" disabled selected>Select type…</option>
            @for (t of types(); track t.id) {
              <option [value]="t.name">{{ t.name }}</option>
            }
          </select>
          <button
            type="button"
            (click)="showTypeModal.set(true)"
            class="bg-slate-800 text-white text-xs px-2 rounded shrink-0"
            title="Add / manage types"
          >
            + Type
          </button>
        </div>

        <input
          [(ngModel)]="form.vehicleModel"
          name="vehicleModel"
          placeholder="Vehicle (e.g. Toyota Corolla)"
          required
          class="border rounded px-3 py-2 text-sm"
        />

        <select
          [(ngModel)]="form.unit"
          name="unit"
          required
          class="border rounded px-3 py-2 text-sm"
        >
          <option value="pcs">Pcs</option>
          <option value="set">Set</option>
        </select>

        <input
          [(ngModel)]="form.reorderLevel"
          name="reorderLevel"
          type="number"
          placeholder="Reorder level"
          required
          class="border rounded px-3 py-2 text-sm"
        />
        <input
          [(ngModel)]="form.currentSalePrice"
          name="currentSalePrice"
          type="number"
          placeholder="Default sale price"
          required
          class="border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          [disabled]="isSubmitting"
          class="bg-blue-600 text-white text-sm px-3 py-2 rounded md:col-span-3"
        >
          {{ isSubmitting ? 'Saving...' : editingId() ? 'Update Product' : 'Save Product' }}
        </button>
      </form>
    }

    <div class="mb-3">
      <app-search-input
        [value]="searchTerm()"
        (valueChange)="onSearchChange($event)"
        placeholder="Search by name, vehicle, category, model, type..."
      />
    </div>

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
            <th class="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          @for (p of paginatedProducts(); track p.id) {
            <tr class="border-t border-gray-200">
              <td class="px-3 py-2">{{ p.name }}</td>
              <td class="px-3 py-2">{{ p.vehicleModel }}</td>
              <td class="px-3 py-2">{{ p.category }}</td>
              <td class="px-3 py-2">{{ p.model }}</td>
              <td class="px-3 py-2">{{ p.type }}</td>
              <td class="px-3 py-2">{{ p.unit }}</td>
              <td class="px-3 py-2 text-right">{{ p.reorderLevel }}</td>
              <td class="px-3 py-2 text-right">Rs {{ p.currentSalePrice | number }}</td>
              <td class="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button
                  (click)="openEditForm(p)"
                  class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded"
                >
                  Edit
                </button>
                <button
                  (click)="confirmDelete(p)"
                  class="bg-red-600 text-white text-xs px-3 py-1.5 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="9" class="px-3 py-4 text-center text-gray-400 text-xs">
                {{ searchTerm() ? 'No products match your search.' : 'No products yet.' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <app-pagination
      [totalItems]="filteredProducts().length"
      [pageSize]="pageSize"
      [currentPage]="currentPage()"
      (currentPageChange)="currentPage.set($event)"
    />

    @if (showCategoryModal()) {
      <app-category-modal (close)="showCategoryModal.set(false)" />
    }
    @if (showModelModal()) {
      <app-model-modal (close)="showModelModal.set(false)" />
    }
    @if (showTypeModal()) {
      <app-type-modal (close)="showTypeModal.set(false)" />
    }

    @if (deleteTarget(); as dt) {
      <div
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        (click)="cancelDelete()"
      >
        <div
          class="bg-white rounded shadow-lg w-full max-w-sm p-5"
          (click)="$event.stopPropagation()"
        >
          <h2 class="font-bold text-slate-800 text-sm mb-2">Delete Product</h2>
          <p class="text-sm text-gray-600 mb-4">
            Delete <span class="font-semibold">{{ dt.name }}</span
            >? This cannot be undone.
          </p>
          <div class="flex gap-2">
            <button (click)="cancelDelete()" class="flex-1 border rounded text-sm px-3 py-2">
              Cancel
            </button>
            <button
              (click)="deleteConfirmed()"
              [disabled]="isDeleting"
              class="flex-1 bg-red-600 disabled:bg-red-300 text-white text-sm px-3 py-2 rounded"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
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
  isDeleting = false;
  showForm = signal(false);
  showCategoryModal = signal(false);
  showModelModal = signal(false);
  showTypeModal = signal(false);
  editingId = signal<string | null>(null);
  deleteTarget = signal<Product | null>(null);
  searchTerm = signal('');

  private emptyForm(): Partial<Product> {
    return {
      name: '',
      category: '',
      model: '',
      type: '',
      vehicleModel: '',
      unit: 'pcs',
      reorderLevel: 5,
      currentSalePrice: 0,
    };
  }

  form: Partial<Product> = this.emptyForm();

  constructor() {
    this.productService.list().subscribe((list) => this.products.set(list));
    this.categoryService.list().subscribe((list) => this.categories.set(list));
    this.modelService.list().subscribe((list) => this.models.set(list));
    this.typeService.list().subscribe((list) => this.types.set(list));
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.products();

    return this.products().filter((p) =>
      [p.name, p.vehicleModel, p.category, p.model, p.type].some((field) =>
        (field ?? '').toLowerCase().includes(term)
      )
    );
  });

  openAddForm() {
    if (this.showForm() && !this.editingId()) {
      this.showForm.set(false);
      return;
    }
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  openEditForm(p: Product) {
    this.editingId.set(p.id ?? null);
    this.form = {
      name: p.name,
      category: p.category,
      model: p.model,
      type: p.type,
      vehicleModel: p.vehicleModel,
      unit: p.unit,
      reorderLevel: p.reorderLevel,
      currentSalePrice: p.currentSalePrice,
    };
    this.showForm.set(true);
  }

  confirmDelete(p: Product) {
    this.deleteTarget.set(p);
  }

  cancelDelete() {
    if (this.isDeleting) return;
    this.deleteTarget.set(null);
  }

  async deleteConfirmed() {
    const target = this.deleteTarget();
    if (!target?.id) return;

    this.isDeleting = true;
    try {
      await this.productService.remove(target.id);
      this.deleteTarget.set(null);
    } finally {
      this.isDeleting = false;
    }
  }

  async save() {
    if (
    !this.form.name?.trim() ||
    !this.form.category ||
    !this.form.model ||
    !this.form.type ||
    !this.form.vehicleModel?.trim() ||
    !this.form.unit ||
    this.form.reorderLevel == null ||
    this.form.currentSalePrice == null
  ) {
    return;
  }

    this.isSubmitting = true;
    try {
      const id = this.editingId();
      if (id) {
        await this.productService.update(id, this.form);
      } else {
        await this.productService.add(this.form as Omit<Product, 'id'>);
      }
      this.form = this.emptyForm();
      this.editingId.set(null);
      this.showForm.set(false);
    } finally {
      this.isSubmitting = false;
    }
  }

  currentPage = signal(1);
  pageSize = 10;
  paginatedProducts = computed(() => {
    const products = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;

    return products.slice(start, end);
  });
}