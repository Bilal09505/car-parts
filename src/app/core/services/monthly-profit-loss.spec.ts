import { describe, expect, it } from 'vitest';
import { summarizeMonthlyProfitLoss } from './monthly-profit-loss';

describe('monthly profit and loss', () => {
  it('includes every month with zero totals when there are no sales', () => {
    const rows = summarizeMonthlyProfitLoss(2026, []);
    expect(rows).toHaveLength(12);
    expect(rows[0].label).toBe('January 2026');
    expect(rows[11].label).toBe('December 2026');
    expect(rows.every(row => row.sales === 0 && row.profit === 0 && row.costOfGoodsSold === 0 && row.saleCount === 0)).toBe(true);
  });

  it('combines profitable and loss-making sales using their recorded costs', () => {
    const rows = summarizeMonthlyProfitLoss(2026, [
      { date: new Date(2026, 2, 1), totalAmount: 1000.5, totalProfit: 200.25 },
      { date: new Date(2026, 2, 31, 23, 59, 59), totalAmount: 400, totalProfit: -300 },
      { date: new Date(2026, 3, 1), totalAmount: 200, totalProfit: 50 },
    ]);
    expect(rows[2]).toMatchObject({ sales: 1400.5, costOfGoodsSold: 1500.25, profit: -99.75, saleCount: 2 });
    expect(rows[3]).toMatchObject({ sales: 200, costOfGoodsSold: 150, profit: 50, saleCount: 1 });
  });

  it('keeps local calendar year boundaries separate and includes leap day', () => {
    const rows = summarizeMonthlyProfitLoss(2024, [
      { date: new Date(2023, 11, 31, 23, 59, 59), totalAmount: 999, totalProfit: 999 },
      { date: new Date(2024, 0, 1), totalAmount: 100, totalProfit: 10 },
      { date: new Date(2024, 1, 29, 23, 59, 59), totalAmount: 200, totalProfit: 20 },
      { date: new Date(2024, 11, 31, 23, 59, 59), totalAmount: 300, totalProfit: 30 },
      { date: new Date(2025, 0, 1), totalAmount: 999, totalProfit: 999 },
    ]);
    expect(rows.reduce((sum, row) => sum + row.sales, 0)).toBe(600);
    expect(rows[0].sales).toBe(100);
    expect(rows[1].sales).toBe(200);
    expect(rows[11].sales).toBe(300);
  });
});
