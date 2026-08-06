import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { Customer } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService extends FirestoreCrudBase<Customer> {
  protected collectionName = 'customers';
  protected override orderByField = 'name';
}
