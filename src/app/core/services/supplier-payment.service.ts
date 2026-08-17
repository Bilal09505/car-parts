import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { SupplierPayment } from '../models';

@Injectable({ providedIn: 'root' })
export class SupplierPaymentService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'supplierPayments');

  paymentsForSupplier(supplierId: string): Observable<SupplierPayment[]> {
    const q = query(this.col, where('supplierId', '==', supplierId), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<SupplierPayment[]>;
  }

  add(payment: Omit<SupplierPayment, 'id'>) {
    return addDoc(this.col, { ...payment, date: Timestamp.now() });
  }

  update(id: string, payment: Partial<Omit<SupplierPayment, 'id' | 'supplierId'>>) {
    const ref = doc(this.firestore, 'supplierPayments', id);
    return updateDoc(ref, { ...payment });
  }
}