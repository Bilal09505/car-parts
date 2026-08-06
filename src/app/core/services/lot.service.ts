import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, query, where, orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Lot } from '../models';

@Injectable({ providedIn: 'root' })
export class LotService {
  private firestore = inject(Firestore);

  /** All lots, newest purchase first — used by the Lot Management / lot-wise profit screen. */
  list(): Observable<Lot[]> {
    const q = query(collection(this.firestore, 'lots'), orderBy('purchaseDate', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Lot[]>;
  }

  /** Lots with stock left for a given product — this feeds the manual lot picker on the Sales screen. */
  listAvailableForProduct(productId: string): Observable<Lot[]> {
    const q = query(
      collection(this.firestore, 'lots'),
      where('productId', '==', productId),
      where('quantityRemaining', '>', 0),
      orderBy('quantityRemaining'),
      orderBy('purchaseDate')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Lot[]>;
  }
}
