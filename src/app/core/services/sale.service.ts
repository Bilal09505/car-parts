import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, runTransaction, Timestamp,
  query, orderBy, where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Sale, SaleItem } from '../models';

export interface SaleLineInput {
  lotId: string;
  productId: string;
  productName: string;
  vehicleModel?:string;
  vehicle?:string;
  quantity: number;
  salePrice: number; // per unit
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private firestore = inject(Firestore);

  list(): Observable<Sale[]> {
    const q = query(collection(this.firestore, 'sales'), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Sale[]>;
  }

  itemsForSale(saleId: string): Observable<SaleItem[]> {
    const q = query(collection(this.firestore, 'saleItems'), where('saleId', '==', saleId));
    return collectionData(q, { idField: 'id' }) as Observable<SaleItem[]>;
  }

  /**
   * Records a sale across one or more manually-picked lots, atomically.
   * Throws (nothing written) if any lot has insufficient quantityRemaining.
   */
  async recordSale(customerId: string | null, customerName: string, lines: SaleLineInput[]) {
    return runTransaction(this.firestore, async (tx) => {
      const saleRef = doc(collection(this.firestore, 'sales'));
      let totalAmount = 0;
      let totalProfit = 0;

      // 1. All reads before any writes — required by Firestore transactions
      const lotSnaps = await Promise.all(
        lines.map((line) => tx.get(doc(this.firestore, 'lots', line.lotId)))
      );

      // 2. Validate stock
      lotSnaps.forEach((snap, i) => {
        const line = lines[i];
        if (!snap.exists()) throw new Error(`Lot ${line.lotId} not found`);
        const remaining = snap.data()['quantityRemaining'] as number;
        if (remaining < line.quantity) {
          throw new Error(
            `Insufficient stock in lot for ${line.productName}: have ${remaining}, need ${line.quantity}`
          );
        }
      });

      // 3. Write: decrement lot, write immutable saleItem row
      lotSnaps.forEach((snap, i) => {
        const line = lines[i];
        const lotData = snap.data()!;
        const costPrice = lotData['purchasePrice'] as number;
        const profit = (line.salePrice - costPrice) * line.quantity;

        tx.update(doc(this.firestore, 'lots', line.lotId), {
          quantityRemaining: lotData['quantityRemaining'] - line.quantity,
          quantitySold: (lotData['quantitySold'] ?? 0) + line.quantity,
          totalProfit: (lotData['totalProfit'] ?? 0) + profit,
        });

        tx.set(doc(collection(this.firestore, 'saleItems')), {
          saleId: saleRef.id,
          lotId: line.lotId,
          productId: line.productId,
          productName: line.productName,
          vehicle:line.vehicle,
          vehicleModel:line.vehicleModel,
          quantity: line.quantity,
          salePrice: line.salePrice,
          costPrice,
          profit,
          date: Timestamp.now(),
        });

        totalAmount += line.salePrice * line.quantity;
        totalProfit += profit;
      });

      // 4. Sale header last
      tx.set(saleRef, {
        customerId,
        customerName,
        date: Timestamp.now(),
        totalAmount,
        totalProfit,
        itemCount: lines.length,
      });

      return saleRef.id;
    });
  }
  listItemsForSale(saleId: string): Observable<any[]> {
    const q = query(collection(this.firestore, 'saleItems'), where('saleId', '==', saleId));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }
  
  salesForCustomer(customerId: string): Observable<Sale[]> {
    const q = query(
      collection(this.firestore, 'sales'),
      where('customerId', '==', customerId),
      orderBy('date', 'desc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Sale[]>;
  }

}
