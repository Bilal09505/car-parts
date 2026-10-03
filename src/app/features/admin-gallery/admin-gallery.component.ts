import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryService } from '../../core/services/gallery.service';
import { GalleryImage } from '../../core/models';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <h1 class="text-xl font-bold text-slate-800 mb-4">Manage Gallery</h1>

      <form (ngSubmit)="save()" class="bg-gray-50 border border-gray-200 rounded p-4 mb-6 grid grid-cols-1 gap-3">
        <input aria-label="Image URL"
          [(ngModel)]="form.imageUrl"
          name="imageUrl"
          placeholder="Image URL"
          required
          class="border rounded px-3 py-2 text-sm"
        />
        <input aria-label="Caption / title"
          [(ngModel)]="form.caption"
          name="caption"
          placeholder="Caption / title"
          class="border rounded px-3 py-2 text-sm"
        />

        @if (form.imageUrl) {
          <img [src]="form.imageUrl" alt="preview" class="h-32 w-auto object-cover rounded border border-gray-200" />
        }

        <button type="submit" class="bg-blue-600 text-white text-sm px-3 py-2 rounded">
          Add Image
        </button>

        @if (error()) {
          <p class="text-xs text-red-600">{{ error() }}</p>
        }
      </form>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        @for (img of images(); track img.id) {
          <div class="border border-gray-200 rounded overflow-hidden">
            <img [src]="img.imageUrl" [alt]="img.caption" class="w-full h-32 object-cover" />
            <div class="p-2">
              <p class="text-xs text-gray-600 truncate">{{ img.caption || '—' }}</p>
              <button
                (click)="remove(img.id!)"
                class="mt-2 w-full bg-red-600 text-white text-xs px-2 py-1.5 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        } @empty {
          <p class="text-sm text-gray-400 col-span-full text-center py-6">No images yet.</p>
        }
      </div>
    </div>
  `,
})
export class AdminGalleryComponent {
  private galleryService = inject(GalleryService);

  images = signal<GalleryImage[]>([]);
  error = signal('');
  form: { imageUrl: string; caption: string } = { imageUrl: '', caption: '' };

  constructor() {
    this.galleryService.list().subscribe((list) => this.images.set(list));
  }

  async save() {
    this.error.set('');
    if (!this.form.imageUrl.trim()) {
      this.error.set('Image URL is required.');
      return;
    }
    try {
      await this.galleryService.add({ imageUrl: this.form.imageUrl.trim(), caption: this.form.caption.trim() });
      this.form = { imageUrl: '', caption: '' };
    } catch (e) {
      this.error.set('Failed to save image. Check console.');
      console.error(e);
    }
  }

  async remove(id: string) {
    if (!confirm('Delete this image?')) return;
    await this.galleryService.delete(id);
  }
}
