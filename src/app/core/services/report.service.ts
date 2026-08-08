import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where, Timestamp } from '@angular/fire/firestore';
import { getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';
import { Product, Lot } from '../models';

export interface DashboardStats {
  totalProducts: number;
  currentStockUnits: number;
  todaysSales: number;
  todaysProfit: number;
  purchasesThisMonth: number;
  lowStockCount: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private firestore = inject(Firestore);

  async dashboardStats(): Promise<DashboardStats> {
    const productsCol = collection(this.firestore, 'products');
    const lotsCol = collection(this.firestore, 'lots');
    const salesCol = collection(this.firestore, 'sales');
    const purchasesCol = collection(this.firestore, 'purchases');

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const [productCount, stockAgg, todaySalesSnap, monthPurchaseAgg, lowStock] = await Promise.all([
      getCountFromServer(productsCol),
      getAggregateFromServer(lotsCol, { totalRemaining: sum('quantityRemaining') }),
      getDocs(query(salesCol, where('date', '>=', Timestamp.fromDate(startOfToday)))),
      getAggregateFromServer(
        query(purchasesCol, where('date', '>=', Timestamp.fromDate(startOfMonth))),
        { totalCost: sum('totalCost') }
      ),
      this.lowStockReport(),
    ]);

    let todaysSales = 0, todaysProfit = 0;
    todaySalesSnap.forEach((d) => {
      todaysSales += d.data()['totalAmount'] ?? 0;
      todaysProfit += d.data()['totalProfit'] ?? 0;
    });

    return {
      totalProducts: productCount.data().count,
      currentStockUnits: stockAgg.data()['totalRemaining'] ?? 0,
      todaysSales,
      todaysProfit,
      purchasesThisMonth: monthPurchaseAgg.data()['totalCost'] ?? 0,
      lowStockCount: lowStock.length,
    };
  }

  /** Sums quantityRemaining across all lots per product, compares to reorderLevel. */
  async lowStockReport(): Promise<{ product: Product; totalRemaining: number }[]> {
    const [productSnap, lotSnap] = await Promise.all([
      getDocs(collection(this.firestore, 'products')),
      getDocs(collection(this.firestore, 'lots')),
    ]);

    const remainingByProduct = new Map<string, number>();
    lotSnap.forEach((d) => {
      const lot = d.data() as Lot;
      remainingByProduct.set(lot.productId, (remainingByProduct.get(lot.productId) ?? 0) + lot.quantityRemaining);
    });

    const result: { product: Product; totalRemaining: number }[] = [];
    productSnap.forEach((d) => {
      const product = { id: d.id, ...d.data() } as Product;
      const totalRemaining = remainingByProduct.get(product.id!) ?? 0;
      if (totalRemaining <= product.reorderLevel) result.push({ product, totalRemaining });
    });
    return result;
  }

  /** Stock report: current remaining quantity per product, aggregated across its lots. */
  async stockReport(): Promise<{ product: Product; totalRemaining: number; stockValue: number }[]> {
    const [productSnap, lotSnap] = await Promise.all([
      getDocs(collection(this.firestore, 'products')),
      getDocs(collection(this.firestore, 'lots')),
    ]);

    const byProduct = new Map<string, { remaining: number; value: number }>();
    lotSnap.forEach((d) => {
      const lot = d.data() as Lot;
      const cur = byProduct.get(lot.productId) ?? { remaining: 0, value: 0 };
      cur.remaining += lot.quantityRemaining;
      cur.value += lot.quantityRemaining * lot.purchasePrice;
      byProduct.set(lot.productId, cur);
    });

    const result: { product: Product; totalRemaining: number; stockValue: number }[] = [];
    productSnap.forEach((d) => {
      const product = { id: d.id, ...d.data() } as Product;
      const agg = byProduct.get(product.id!) ?? { remaining: 0, value: 0 };
      result.push({ product, totalRemaining: agg.remaining, stockValue: agg.value });
    });
    return result;
  }
  async salesTrend7Days(): Promise<{ label: string; amount: number }[]> {
    const salesCol = collection(this.firestore, 'sales');
    const days: { label: string; amount: number }[] = [];

    const starts: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      starts.push(d);
    }

    const results = await Promise.all(
      starts.map(async (start) => {
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const snap = await getAggregateFromServer(
          query(salesCol, where('date', '>=', Timestamp.fromDate(start)), where('date', '<', Timestamp.fromDate(end))),
          { totalAmount: sum('totalAmount') }
        );
        return {
          label: start.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: snap.data()['totalAmount'] ?? 0,
        };
      })
    );

    return results;
  }
}
