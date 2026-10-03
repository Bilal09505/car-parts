import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { Supplier } from '../models';
@Injectable({ providedIn: 'root' })
export class SupplierService extends FirestoreCrudBase<Supplier> {
  protected collectionName = 'suppliers';
  getById(id: string) { return this.get(id); }
}
