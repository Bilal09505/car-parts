import { Injectable, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { map } from 'rxjs';
import { SupplierPayment } from '../models';
import { OfflineDataService } from './offline-data.service';
@Injectable({ providedIn: 'root' })
export class SupplierPaymentService {
  private data = inject(OfflineDataService);
  paymentsForSupplier(supplierId: string) {
    return this.data.watch<SupplierPayment>('supplierPayments').pipe(map(rows => rows.filter(row => row.supplierId === supplierId)
      .sort((a, b) => (b.date?.toMillis() ?? 0) - (a.date?.toMillis() ?? 0))));
  }
  async add(payment: Omit<SupplierPayment, 'id'>) {
    const id = this.data.newId();
    await this.data.write('supplierPayments', id, { ...payment, date: Timestamp.now() }, true);
    return { id };
  }
  update(id: string, payment: Partial<Omit<SupplierPayment, 'id' | 'supplierId'>>) {
    return this.data.write('supplierPayments', id, payment);
  }
}
