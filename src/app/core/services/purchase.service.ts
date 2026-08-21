import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, writeBatch, Timestamp, query, orderBy, where,getDoc
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
  vihcleFilter?:string;
  category?: string;
  model?: string;   // new
  type?: string;    // new
  vehicleModel?: string;
  vehicle?:string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private firestore = inject(Firestore);

  list(): Observable<Purchase[]> {
    const q = query(collection(this.firestore, 'purchases'), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Purchase[]>;
  }

  /**
   * Purchases for a single supplier, newest first. Requires a Firestore
   * composite index on (supplierId asc, date desc) — Firestore will log a
   * console error with a one-click link to create it the first time this runs.
   */
  purchasesForSupplier(supplierId: string): Observable<Purchase[]> {
    const q = query(
      collection(this.firestore, 'purchases'),
      where('supplierId', '==', supplierId),
      orderBy('date', 'desc'),
    );
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

// ...

/** True if any lot created by this purchase has had units sold. */
async hasSaleActivity(purchase: Purchase): Promise<boolean> {
  const lotSnaps = await Promise.all(
    purchase.lotIds.map((id) => getDoc(doc(this.firestore, 'lots', id))),
  );
  return lotSnaps.some((s) => s.exists() && (s.data()['quantitySold'] ?? 0) > 0);
}

async deletePurchase(purchaseId: string) {
  const purchaseRef = doc(this.firestore, 'purchases', purchaseId);
  const snap = await getDoc(purchaseRef);
  if (!snap.exists()) throw new Error('Purchase not found.');
  const purchase = snap.data() as Purchase;

  if (await this.hasSaleActivity(purchase)) {
    throw new Error('Cannot delete: one or more items from this purchase have already been sold.');
  }

  const batch = writeBatch(this.firestore);
  batch.delete(purchaseRef);
  for (const lotId of purchase.lotIds) {
    batch.delete(doc(this.firestore, 'lots', lotId));
  }
  await batch.commit();
}

async updatePurchase(
  purchaseId: string,
  supplierId: string,
  supplierName: string,
  items: PurchaseLineInput[],
) {
  const purchaseRef = doc(this.firestore, 'purchases', purchaseId);
  const snap = await getDoc(purchaseRef);
  if (!snap.exists()) throw new Error('Purchase not found.');
  const existing = snap.data() as Purchase;

  if (await this.hasSaleActivity(existing)) {
    throw new Error('Cannot edit: one or more items from this purchase have already been sold.');
  }

  const batch = writeBatch(this.firestore);

  // Nothing's sold yet, so it's safe to wipe and recreate the lots.
  for (const lotId of existing.lotIds) {
    batch.delete(doc(this.firestore, 'lots', lotId));
  }

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
      purchaseId,
      supplierId,
      supplierName,
      purchaseDate: existing.date, // keep original purchase date, don't reset it
      active: true,
    });
  }

  batch.update(purchaseRef, {
    supplierId,
    supplierName,
    totalCost,
    lotIds,
    items,
  });

  await batch.commit();
}
}