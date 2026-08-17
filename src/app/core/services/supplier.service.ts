import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { Supplier } from '../models';
import { doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupplierService extends FirestoreCrudBase<Supplier> {
  protected collectionName = 'suppliers';
  protected override orderByField = 'name';
  getById(id: string): Observable<Supplier | undefined> {
  const ref = doc(this.firestore, 'suppliers', id);
  return docData(ref, { idField: 'id' }) as Observable<Supplier | undefined>;
}
}
