import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OfflineDataService } from './offline-data.service';

@Injectable()
export abstract class FirestoreCrudBase<T extends { id?: string }> {
  protected data = inject(OfflineDataService);
  protected abstract collectionName: string;
  protected orderByField = 'name';
  list(): Observable<T[]> {
    return this.data.watch<T>(this.collectionName).pipe(map(rows => [...rows].sort((a, b) =>
      String((a as any)[this.orderByField] ?? '').localeCompare(String((b as any)[this.orderByField] ?? '')))));
  }
  get(id: string): Observable<T | undefined> { return this.list().pipe(map(rows => rows.find(row => row.id === id))); }
  async add(data: Omit<T, 'id'>): Promise<string> {
    const id = this.data.newId();
    await this.data.write(this.collectionName, id, data, true);
    return id;
  }
  update(id: string, data: Partial<T>): Promise<void> { return this.data.write(this.collectionName, id, data); }
  remove(id: string): Promise<void> { return this.data.write(this.collectionName, id, null); }
}
