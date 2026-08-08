import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelService } from '../../core/services/model.service';
import { CarModel } from '../../core/models';

@Component({
  selector: 'app-model-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" (click)="close.emit()">
      <div class="bg-white rounded shadow-lg w-full max-w-md p-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-slate-800">Manage Models</h2>
          <button (click)="close.emit()" class="text-gray-500 text-lg leading-none">✕</button>
        </div>

        <div class="max-h-64 overflow-y-auto border border-gray-200 rounded mb-3 divide-y divide-gray-100">
          @for (m of models(); track m.id) {
            <div class="flex items-center justify-between px-3 py-2 text-sm">
              @if (editingId() === m.id) {
                <input [(ngModel)]="editingName" class="border rounded px-2 py-1 text-sm flex-1 mr-2" />
                <div class="flex gap-2 shrink-0">
                  <button (click)="saveEdit(m)" class="text-blue-600 text-xs font-medium">Save</button>
                  <button (click)="editingId.set(null)" class="text-gray-500 text-xs">Cancel</button>
                </div>
              } @else {
                <span>{{ m.name }}</span>
                <div class="flex gap-2 shrink-0">
                  <button (click)="startEdit(m)" class="text-blue-600 text-xs font-medium">Edit</button>
                  <button (click)="remove(m)" class="text-red-600 text-xs font-medium">Delete</button>
                </div>
              }
            </div>
          } @empty {
            <div class="px-3 py-3 text-sm text-gray-400">No models yet — add one below.</div>
          }
        </div>

        <div class="flex gap-2">
          <input [(ngModel)]="newName" placeholder="New model name" (keyup.enter)="add()"
                 class="border rounded px-3 py-2 text-sm flex-1" />
          <button (click)="add()" class="bg-orange-600 text-white text-sm px-3 py-2 rounded shrink-0">Add</button>
        </div>
      </div>
    </div>
  `,
})
export class ModelModalComponent {
  private modelService = inject(ModelService);
  close = output<void>();

  models = signal<CarModel[]>([]);
  newName = '';
  editingId = signal<string | null>(null);
  editingName = '';

  constructor() {
    this.modelService.list().subscribe((list) => this.models.set(list));
  }

  async add() {
    const name = this.newName.trim();
    if (!name) return;
    await this.modelService.add({ name });
    this.newName = '';
  }

  startEdit(m: CarModel) {
    this.editingId.set(m.id!);
    this.editingName = m.name;
  }

  async saveEdit(m: CarModel) {
    const name = this.editingName.trim();
    if (!name) return;
    await this.modelService.update(m.id!, { name });
    this.editingId.set(null);
  }

  async remove(m: CarModel) {
    if (!confirm(`Delete model "${m.name}"? Products already using it keep the name as text.`)) return;
    await this.modelService.remove(m.id!);
  }
}