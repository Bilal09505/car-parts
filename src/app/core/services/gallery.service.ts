import { Injectable, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { map } from 'rxjs';
import { GalleryImage } from '../models';
import { OfflineDataService } from './offline-data.service';
@Injectable({ providedIn: 'root' })
export class GalleryService {
  private data = inject(OfflineDataService);
  list() { return this.data.watch<GalleryImage>('gallery').pipe(map(rows => [...rows].sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)))); }
  async add(data: { imageUrl: string; caption: string }) {
    await this.data.write('gallery', this.data.newId(), { ...data, createdAt: Timestamp.now() }, true);
  }
  update(id: string, data: Partial<GalleryImage>) { return this.data.write('gallery', id, data); }
  delete(id: string) { return this.data.write('gallery', id, null); }
}
