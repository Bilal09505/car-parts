import { inject, Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, docData,
  addDoc, updateDoc, deleteDoc, query, orderBy, CollectionReference,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

/**
 * Thin wrapper over a Firestore collection giving list/get/add/update/delete.
 * Extend this for each entity instead of rewriting the same six functions.
 */
@Injectable()
export abstract class FirestoreCrudBase<T extends { id?: string }> {
  protected firestore = inject(Firestore);
  protected abstract collectionName: string;
  protected orderByField = 'name';

  protected col(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  list(): Observable<T[]> {
    const q = query(this.col(), orderBy(this.orderByField));
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  get(id: string): Observable<T | undefined> {
    return docData(doc(this.firestore, this.collectionName, id), { idField: 'id' }) as Observable<T>;
  }

  add(data: Omit<T, 'id'>): Promise<string> {
    return addDoc(this.col(), data as any).then((ref) => ref.id);
  }

  update(id: string, data: Partial<T>): Promise<void> {
    return updateDoc(doc(this.firestore, this.collectionName, id), data as any);
  }

  remove(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, this.collectionName, id));
  }
}
