import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportService } from '../services/report.service';
import { MonthlyProfitLoss, summarizeMonthlyProfitLoss } from '../services/monthly-profit-loss';
import { MonthlyProfitLossComponent } from './monthly-profit-loss.component';

describe('MonthlyProfitLossComponent', () => {
  const reportService = { monthlyProfitLoss: vi.fn(), revision: signal(0) };

  beforeEach(() => {
    reportService.monthlyProfitLoss.mockReset();
    TestBed.configureTestingModule({
      imports: [MonthlyProfitLossComponent],
      providers: [{ provide: ReportService, useValue: reportService }],
    });
  });

  it('shows losses and a yearly breakdown, and switches months without reloading the year', async () => {
    reportService.monthlyProfitLoss.mockResolvedValue(summarizeMonthlyProfitLoss(2026, [
      { date: new Date(2026, 2, 10), totalAmount: 400, totalProfit: -100 },
    ]));
    const fixture = TestBed.createComponent(MonthlyProfitLossComponent);
    fixture.componentRef.setInput('showBreakdown', true);
    fixture.componentInstance.selectedMonth.set('2026-03');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Gross Loss');
    expect(fixture.nativeElement.textContent).toContain('Rs -100');
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(12);
    fixture.componentInstance.changeMonth('2026-04');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No sales recorded for this month.');
    expect(reportService.monthlyProfitLoss).toHaveBeenCalledTimes(1);
  });

  it('shows a retry after failure and recovers', async () => {
    reportService.monthlyProfitLoss.mockRejectedValueOnce(new Error('offline'));
    const fixture = TestBed.createComponent(MonthlyProfitLossComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    reportService.monthlyProfitLoss.mockResolvedValue(summarizeMonthlyProfitLoss(fixture.componentInstance.selectedYear(), []));
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No sales recorded for this month.');
  });

  it('ignores an older request that completes after a newer year', async () => {
    let resolveOld!: (rows: MonthlyProfitLoss[]) => void;
    reportService.monthlyProfitLoss.mockReturnValueOnce(new Promise<MonthlyProfitLoss[]>(resolve => { resolveOld = resolve; }));
    const fixture = TestBed.createComponent(MonthlyProfitLossComponent);
    const component = fixture.componentInstance;
    component.selectedMonth.set('2025-12');
    const oldRequest = component.loadYear();
    reportService.monthlyProfitLoss.mockResolvedValue(summarizeMonthlyProfitLoss(2026, []));
    component.selectedMonth.set('2026-01');
    await component.loadYear();
    resolveOld(summarizeMonthlyProfitLoss(2025, []));
    await oldRequest;
    expect(component.selectedRow()?.label).toBe('January 2026');
    expect(component.loading()).toBe(false);
  });
});
