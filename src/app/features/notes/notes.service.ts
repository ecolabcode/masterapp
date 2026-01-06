import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { map } from 'rxjs';
import { NoteItem } from './notes.model';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private db = inject(Firestore);

  list(uid: string) {
    const ref = collection(this.db, 'notes');
    const q = query(ref, where('uid', '==', uid), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(map((x) => x as NoteItem[]));
  }

  create(uid: string, date: string, notes: string) {
    return addDoc(collection(this.db, 'notes'), { uid, date, notes });
  }

  update(id: string, notes: string) {
    return updateDoc(doc(this.db, 'notes', id), { notes });
  }

  remove(id: string) {
    return deleteDoc(doc(this.db, 'notes', id));
  }
}
