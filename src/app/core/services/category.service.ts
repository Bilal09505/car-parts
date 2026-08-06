import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { Category } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService extends FirestoreCrudBase<Category> {
  protected collectionName = 'categories';
  protected override orderByField = 'name';
}
