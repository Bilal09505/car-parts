import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ProductType } from '../models';

@Injectable({ providedIn: 'root' })
export class TypeService {
  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'types');

  list(): Observable<ProductType[]> {
    return collectionData(this.collectionRef, { idField: 'id' }) as Observable<ProductType[]>;
  }

  async add(type: Omit<ProductType, 'id'>) {
    await addDoc(this.collectionRef, type);
  }

  async update(id: string, type: Partial<ProductType>) {
    await updateDoc(doc(this.firestore, 'types', id), type);
  }

  async remove(id: string) {
    await deleteDoc(doc(this.firestore, 'types', id));
  }
}