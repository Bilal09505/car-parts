export interface MonthlyProfitLoss {
  month: number;
  label: string;
  sales: number;
  costOfGoodsSold: number;
  profit: number;
  saleCount: number;
}

interface DatedSale {
  date: Date;
  totalAmount: number;
  totalProfit: number;
}

/** Uses the cost recorded at sale time, including sales of stock bought in earlier months. */
export function summarizeMonthlyProfitLoss(year: number, sales: DatedSale[]): MonthlyProfitLoss[] {
  const months = Array.from({ length: 12 }, (_, month) => ({
    month,
    label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    sales: 0,
    costOfGoodsSold: 0,
    profit: 0,
    saleCount: 0,
  }));

  for (const sale of sales) {
    if (sale.date.getFullYear() !== year) continue;
    const row = months[sale.date.getMonth()];
    row.sales += sale.totalAmount;
    row.profit += sale.totalProfit;
    row.costOfGoodsSold += sale.totalAmount - sale.totalProfit;
    row.saleCount++;
  }
  return months;
}
