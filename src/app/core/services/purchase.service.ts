import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, writeBatch, Timestamp, query, orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Purchase } from '../models';

export interface PurchaseLineInput {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  categoryFilter?: string;
  modelFilter?: string;
  typeFilter?: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private firestore = inject(Firestore);

  list(): Observable<Purchase[]> {
    const q = query(collection(this.firestore, 'purchases'), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Purchase[]>;
  }

  /**
   * A purchase invoice creates ONE new lot per line item, even if the same
   * product was bought before at a different price. This is what makes
   * lot-wise costing/profit possible later at sale time.
   */
  async createPurchase(supplierId: string, supplierName: string, items: PurchaseLineInput[]) {
    const batch = writeBatch(this.firestore);
    const purchaseRef = doc(collection(this.firestore, 'purchases'));
    const now = Timestamp.now();
    const lotIds: string[] = [];
    let totalCost = 0;

    for (const item of items) {
      const lotRef = doc(collection(this.firestore, 'lots'));
      lotIds.push(lotRef.id);
      totalCost += item.quantity * item.unitCost;

      batch.set(lotRef, {
        productId: item.productId,
        productName: item.productName,
        purchasePrice: item.unitCost,
        quantityPurchased: item.quantity,
        quantityRemaining: item.quantity,
        quantitySold: 0,
        totalProfit: 0,
        purchaseId: purchaseRef.id,
        supplierId,
        supplierName,
        purchaseDate: now,
        active: true,
      });
    }

    batch.set(purchaseRef, {
      supplierId,
      supplierName,
      date: now,
      totalCost,
      lotIds,
      items,
    });

    await batch.commit();
    return purchaseRef.id;
  }
}
