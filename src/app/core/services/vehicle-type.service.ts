import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import {  VehicleModel } from '../models';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'vehicles');

  list(): Observable<VehicleModel[]> {
    return collectionData(this.collectionRef, { idField: 'id' }) as Observable<VehicleModel[]>;
  }

  async add(vehicle: Omit<VehicleModel, 'id'>) {
    await addDoc(this.collectionRef, vehicle);
  }

  async update(id: string, type: Partial<VehicleModel>) {
    await updateDoc(doc(this.firestore, 'vehicles', id), type);
  }

  async remove(id: string) {
    await deleteDoc(doc(this.firestore, 'vehicles', id));
  }
}