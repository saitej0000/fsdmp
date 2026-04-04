import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, increment, startAfter } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  constructor(private firebase: FirebaseService) {}

  async getPosts(lastDoc?: any) {
    let q = query(collection(this.firebase.db, 'posts'), orderBy('createdAt', 'desc'), limit(12));
    if (lastDoc) {
      q = query(collection(this.firebase.db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(12));
    }
    const snapshot = await getDocs(q);
    return {
      posts: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    };
  }

  async getPost(postId: string) {
    const docRef = doc(this.firebase.db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  // Adding minimal required stubs for now to get Home working
  async createNotification(userId: string, actorId: string, type: 'like' | 'comment' | 'follow', postId?: string, commentId?: string) {
    if (userId === actorId) return;
    const notificationRef = doc(collection(this.firebase.db, 'notifications'));
    const data: any = { userId, actorId, type, read: false, createdAt: serverTimestamp() };
    if (postId) data.postId = postId;
    if (commentId) data.commentId = commentId;
    await setDoc(notificationRef, data);
  }
}
