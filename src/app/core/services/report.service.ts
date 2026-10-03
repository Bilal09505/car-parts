import { Injectable, inject } from '@angular/core';
import { Product, Lot, Sale, Purchase } from '../models';
import { MonthlyProfitLoss, summarizeMonthlyProfitLoss } from './monthly-profit-loss';
import { OfflineDataService } from './offline-data.service';

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
  private data = inject(OfflineDataService);
  revision = this.data.revision;
  async monthlyProfitLoss(year: number): Promise<MonthlyProfitLoss[]> {
    const sales = await this.data.read<Sale>('sales');
    return summarizeMonthlyProfitLoss(year, sales.map(sale => ({
      date: sale.date.toDate(), totalAmount: sale.totalAmount ?? 0, totalProfit: sale.totalProfit ?? 0,
    })));
  }
  async dashboardStats(): Promise<DashboardStats> {
    const [products, lots, sales, purchases] = await Promise.all([
      this.data.read<Product>('products'), this.data.read<Lot>('lots'),
      this.data.read<Sale>('sales'), this.data.read<Purchase>('purchases'),
    ]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const todaySales = sales.filter(sale => sale.date.toMillis() >= +today && sale.date.toMillis() < +tomorrow);
    const lowStock = products.filter(product => lots.filter(lot => lot.productId === product.id)
      .reduce((sum, lot) => sum + lot.quantityRemaining, 0) <= product.reorderLevel);
    return {
      totalProducts: products.length,
      currentStockUnits: lots.reduce((sum, lot) => sum + lot.quantityRemaining, 0),
      todaysSales: todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      todaysProfit: todaySales.reduce((sum, sale) => sum + sale.totalProfit, 0),
      purchasesThisMonth: purchases.filter(purchase => purchase.date.toMillis() >= +start && purchase.date.toMillis() < +end)
        .reduce((sum, purchase) => sum + purchase.totalCost, 0),
      lowStockCount: lowStock.length,
    };
  }
  async lowStockReport(): Promise<{ product: Product; totalRemaining: number }[]> {
    return (await this.stockReport()).filter(row => row.totalRemaining <= row.product.reorderLevel);
  }
  async stockReport(): Promise<{ product: Product; totalRemaining: number; stockValue: number }[]> {
    const [products, lots] = await Promise.all([this.data.read<Product>('products'), this.data.read<Lot>('lots')]);
    return products.map(product => {
      const stock = lots.filter(lot => lot.productId === product.id);
      return { product, totalRemaining: stock.reduce((sum, lot) => sum + lot.quantityRemaining, 0),
        stockValue: stock.reduce((sum, lot) => sum + lot.quantityRemaining * lot.purchasePrice, 0) };
    });
  }
  async salesTrend7Days(): Promise<{ label: string; amount: number }[]> {
    const sales = await this.data.read<Sale>('sales');
    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date();
      start.setDate(start.getDate() - 6 + index); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      return { label: start.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: sales.filter(sale => sale.date.toMillis() >= +start && sale.date.toMillis() < +end)
          .reduce((sum, sale) => sum + sale.totalAmount, 0) };
    });
  }
}
