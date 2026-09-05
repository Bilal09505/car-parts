import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { GalleryImage } from '../models';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'gallery');

  list(): Observable<GalleryImage[]> {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<GalleryImage[]>;
  }

  async add(data: { imageUrl: string; caption: string }): Promise<void> {
    await addDoc(this.collectionRef, {
      imageUrl: data.imageUrl,
      caption: data.caption ?? '',
      createdAt: serverTimestamp(),
    });
  }

  async update(id: string, data: Partial<GalleryImage>): Promise<void> {
    const ref = doc(this.firestore, 'gallery', id);
    await updateDoc(ref, { ...data });
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.firestore, 'gallery', id);
    await deleteDoc(ref);
  }
}