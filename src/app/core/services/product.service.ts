import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { Product } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService extends FirestoreCrudBase<Product> {
  protected collectionName = 'products';
  protected override orderByField = 'name';
}
