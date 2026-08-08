import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TypeService } from '../../core/services/type.service';
import { ProductType } from '../../core/models';

@Component({
  selector: 'app-type-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" (click)="close.emit()">
      <div class="bg-white rounded shadow-lg w-full max-w-md p-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-slate-800">Manage Types</h2>
          <button (click)="close.emit()" class="text-gray-500 text-lg leading-none">✕</button>
        </div>

        <div class="max-h-64 overflow-y-auto border border-gray-200 rounded mb-3 divide-y divide-gray-100">
          @for (t of types(); track t.id) {
            <div class="flex items-center justify-between px-3 py-2 text-sm">
              @if (editingId() === t.id) {
                <input [(ngModel)]="editingName" class="border rounded px-2 py-1 text-sm flex-1 mr-2" />
                <div class="flex gap-2 shrink-0">
                  <button (click)="saveEdit(t)" class="text-blue-600 text-xs font-medium">Save</button>
                  <button (click)="editingId.set(null)" class="text-gray-500 text-xs">Cancel</button>
                </div>
              } @else {
                <span>{{ t.name }}</span>
                <div class="flex gap-2 shrink-0">
                  <button (click)="startEdit(t)" class="text-blue-600 text-xs font-medium">Edit</button>
                  <button (click)="remove(t)" class="text-red-600 text-xs font-medium">Delete</button>
                </div>
              }
            </div>
          } @empty {
            <div class="px-3 py-3 text-sm text-gray-400">No types yet — add one below.</div>
          }
        </div>

        <div class="flex gap-2">
          <input [(ngModel)]="newName" placeholder="New type name" (keyup.enter)="add()"
                 class="border rounded px-3 py-2 text-sm flex-1" />
          <button (click)="add()" class="bg-orange-600 text-white text-sm px-3 py-2 rounded shrink-0">Add</button>
        </div>
      </div>
    </div>
  `,
})
export class TypeModalComponent {
  private typeService = inject(TypeService);
  close = output<void>();

  types = signal<ProductType[]>([]);
  newName = '';
  editingId = signal<string | null>(null);
  editingName = '';

  constructor() {
    this.typeService.list().subscribe((list) => this.types.set(list));
  }

  async add() {
    const name = this.newName.trim();
    if (!name) return;
    await this.typeService.add({ name });
    this.newName = '';
  }

  startEdit(t: ProductType) {
    this.editingId.set(t.id!);
    this.editingName = t.name;
  }

  async saveEdit(t: ProductType) {
    const name = this.editingName.trim();
    if (!name) return;
    await this.typeService.update(t.id!, { name });
    this.editingId.set(null);
  }

  async remove(t: ProductType) {
    if (!confirm(`Delete type "${t.name}"? Products already using it keep the name as text.`)) return;
    await this.typeService.remove(t.id!);
  }
}