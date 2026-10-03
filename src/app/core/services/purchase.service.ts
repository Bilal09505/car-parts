import { Injectable, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { map } from 'rxjs';
import { Purchase, Lot } from '../models';
import { OfflineDataService } from './offline-data.service';
import { LocalWrite, documentData } from './offline-store';

export interface PurchaseLineInput {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  categoryFilter?: string;
  modelFilter?: string;
  typeFilter?: string;
  vihcleFilter?: string;
  category?: string;
  model?: string;
  type?: string;
  vehicleModel?: string;
  vehicle?: string;
}
@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private data = inject(OfflineDataService);
  list() { return this.data.watch<Purchase>('purchases').pipe(map(rows => [...rows].sort((a, b) => b.date.toMillis() - a.date.toMillis()))); }
  purchasesForSupplier(id: string) { return this.list().pipe(map(rows => rows.filter(row => row.supplierId === id))); }
  async hasSaleActivity(purchase: Purchase) {
    const lots = await this.data.read<Lot>('lots');
    return lots.some(lot => purchase.lotIds.includes(lot.id!) && lot.quantitySold > 0);
  }
  private purchaseWrites(id: string, supplierId: string, supplierName: string, items: PurchaseLineInput[], date: Timestamp, expected: any = null): LocalWrite[] {
    if (!items.length || items.some(item => !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitCost) || item.unitCost < 0)) {
      throw new Error('Select a product, positive quantity and valid unit cost for every line.');
    }
    const lotIds: string[] = [];
    const writes: LocalWrite[] = items.map(item => {
      const lotId = this.data.newId();
      lotIds.push(lotId);
      return { collection: 'lots', id: lotId, expected: null, data: {
        productId: item.productId, productName: item.productName, purchasePrice: item.unitCost,
        quantityPurchased: item.quantity, quantityRemaining: item.quantity, quantitySold: 0, totalProfit: 0,
        purchaseId: id, supplierId, supplierName, purchaseDate: date, active: true,
      } };
    });
    writes.push({ collection: 'purchases', id, expected, data: {
      supplierId, supplierName, date, totalCost: items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0), lotIds, items,
    } });
    return writes;
  }
  async createPurchase(supplierId: string, supplierName: string, items: PurchaseLineInput[]) {
    const id = this.data.newId();
    await this.data.enqueue('Purchase · ' + supplierName, this.purchaseWrites(id, supplierId, supplierName, items, Timestamp.now()));
    return id;
  }
  private async editablePurchase(id: string) {
    const purchases = await this.data.read<Purchase>('purchases');
    const purchase = purchases.find(row => row.id === id);
    if (!purchase) throw new Error('Purchase is not downloaded on this device.');
    const lots = await this.data.read<Lot>('lots');
    const selected = purchase.lotIds.map(id => lots.find(lot => lot.id === id));
    if (selected.some(lot => !lot || lot.quantitySold > 0)) throw new Error('Cannot edit or delete: stock has been sold or is unavailable.');
    return { purchase, lots: selected as Lot[] };
  }
  async deletePurchase(id: string) {
    const { purchase, lots } = await this.editablePurchase(id);
    await this.data.enqueue('Delete purchase · ' + purchase.supplierName, [
      { collection: 'purchases', id, expected: documentData(purchase), data: null },
      ...lots.map(lot => ({ collection: 'lots', id: lot.id!, expected: documentData(lot), data: null })),
    ]);
  }
  async updatePurchase(id: string, supplierId: string, supplierName: string, items: PurchaseLineInput[]) {
    const { purchase, lots } = await this.editablePurchase(id);
    await this.data.enqueue('Update purchase · ' + supplierName, [
      ...lots.map(lot => ({ collection: 'lots', id: lot.id!, expected: documentData(lot), data: null })),
      ...this.purchaseWrites(id, supplierId, supplierName, items, purchase.date, documentData(purchase)),
    ]);
  }
}
