import { Injectable } from '@angular/core';
import { FirestoreCrudBase } from './firestore-crud.base';
import { VehicleModel } from '../models';
@Injectable({ providedIn: 'root' })
export class VehicleService extends FirestoreCrudBase<VehicleModel> { protected collectionName = 'vehicles'; }
