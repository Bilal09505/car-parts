import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { Lot } from '../models';
import { OfflineDataService } from './offline-data.service';
@Injectable({ providedIn: 'root' })
export class LotService {
  private data = inject(OfflineDataService);
  list() { return this.data.watch<Lot>('lots').pipe(map(rows => [...rows].sort((a, b) => b.purchaseDate.toMillis() - a.purchaseDate.toMillis()))); }
  listAvailableForProduct(productId: string) {
    return this.list().pipe(map(rows => rows.filter(row => row.productId === productId && row.quantityRemaining > 0)
      .sort((a, b) => a.quantityRemaining - b.quantityRemaining || a.purchaseDate.toMillis() - b.purchaseDate.toMillis())));
  }
  listAllAvailable() { return this.list().pipe(map(rows => rows.filter(row => row.quantityRemaining > 0))); }
}
