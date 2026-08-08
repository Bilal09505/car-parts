import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CarModel } from '../models';

@Injectable({ providedIn: 'root' })
export class ModelService {
  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'models');

  list(): Observable<CarModel[]> {
    return collectionData(this.collectionRef, { idField: 'id' }) as Observable<CarModel[]>;
  }

  async add(model: Omit<CarModel, 'id'>) {
    await addDoc(this.collectionRef, model);
  }

  async update(id: string, model: Partial<CarModel>) {
    await updateDoc(doc(this.firestore, 'models', id), model);
  }

  async remove(id: string) {
    await deleteDoc(doc(this.firestore, 'models', id));
  }
}