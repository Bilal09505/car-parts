import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { ProductType } from '../models';
@Injectable({ providedIn: 'root' })
export class TypeService extends FirestoreCrudBase<ProductType> { protected collectionName = 'types'; }
