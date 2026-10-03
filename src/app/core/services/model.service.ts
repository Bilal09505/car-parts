import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { CarModel } from '../models';
@Injectable({ providedIn: 'root' })
export class ModelService extends FirestoreCrudBase<CarModel> { protected collectionName = 'models'; }
