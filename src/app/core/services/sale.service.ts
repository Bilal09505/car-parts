import { Injectable, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { map } from 'rxjs';
import { Lot, Sale, SaleItem } from '../models';
import { OfflineDataService } from './offline-data.service';
import { LocalWrite, documentData } from './offline-store';

export interface SaleLineInput {
  lotId: string;
  productId: string;
  productName: string;
  vehicleModel?: string;
  vehicle?: string;
  quantity: number;
  salePrice: number;
}
@Injectable({ providedIn: 'root' })
export class SaleService {
  private data = inject(OfflineDataService);
  list() { return this.data.watch<Sale>('sales').pipe(map(rows => [...rows].sort((a, b) => b.date.toMillis() - a.date.toMillis()))); }
  itemsForSale(saleId: string) { return this.data.watch<SaleItem>('saleItems').pipe(map(rows => rows.filter(row => row.saleId === saleId))); }
  listItemsForSale(saleId: string) { return this.itemsForSale(saleId); }
  salesForCustomer(customerId: string) { return this.list().pipe(map(rows => rows.filter(row => row.customerId === customerId))); }

  async recordSale(customerId: string | null, customerName: string, lines: SaleLineInput[]) {
    if (!lines.length) throw new Error('Add at least one item to the sale.');
    const lots = await this.data.read<Lot>('lots');
    const id = this.data.newId();
    const date = Timestamp.now();
    const writes: LocalWrite[] = [];
    const stocks = new Map<string, LocalWrite>();
    let totalAmount = 0;
    let totalProfit = 0;
    for (const line of lines) {
      if (!Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.salePrice) || line.salePrice <= 0) {
        throw new Error('Quantity and sale price must be positive numbers.');
      }
      const lot = lots.find(lot => lot.id === line.lotId);
      if (!lot || lot.productId !== line.productId) throw new Error('Selected stock is unavailable on this device.');
      const profit = (line.salePrice - lot.purchasePrice) * line.quantity;
      const stock: LocalWrite = stocks.get(line.lotId) ?? {
        collection: 'lots', id: line.lotId, expected: documentData(lot), data: documentData(lot),
        stock: { quantity: 0, profit: 0, cost: lot.purchasePrice, productId: lot.productId },
      };
      stock.stock!.quantity += line.quantity;
      stock.stock!.profit += profit;
      if (stock.stock!.quantity > lot.quantityRemaining) throw new Error('Insufficient stock for ' + line.productName + ', including other lines in this sale.');
      stock.data = { ...documentData(lot), quantityRemaining: lot.quantityRemaining - stock.stock!.quantity,
        quantitySold: (lot.quantitySold ?? 0) + stock.stock!.quantity, totalProfit: (lot.totalProfit ?? 0) + stock.stock!.profit };
      stocks.set(line.lotId, stock);
      writes.push({ collection: 'saleItems', id: this.data.newId(), expected: null, data: {
        saleId: id, lotId: line.lotId, productId: line.productId, productName: line.productName,
        vehicle: line.vehicle ?? '', vehicleModel: line.vehicleModel ?? '', quantity: line.quantity,
        salePrice: line.salePrice, costPrice: lot.purchasePrice, profit, date,
      } });
      totalAmount += line.quantity * line.salePrice;
      totalProfit += profit;
    }
    writes.push(...stocks.values(), { collection: 'sales', id, expected: null,
      data: { customerId, customerName, date, totalAmount, totalProfit, itemCount: lines.length } });
    await this.data.enqueue('Sale · ' + (customerName || 'Walk-in') + ' · Rs ' + totalAmount, writes);
    return id;
  }
}
