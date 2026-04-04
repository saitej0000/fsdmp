import { Injectable } from '@angular/core';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, increment, startAfter, addDoc
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

// Wraps a promise with a timeout so Firestore hangs fail gracefully
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms. Check Firestore rules and network.`)), ms)
  );
  return Promise.race([promise, timeout]);
}

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
    const snapshot = await withTimeout(getDocs(q));
    return {
      posts: snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    };
  }

  async getPost(postId: string): Promise<any> {
    const docSnap = await withTimeout(getDoc(doc(this.firebase.db, 'posts', postId)));
    return docSnap.exists() ? { id: docSnap.id, ...(docSnap.data() as any) } : null;
  }

  async createPost(postData: any) {
    const newPostRef = doc(collection(this.firebase.db, 'posts'));
    await withTimeout(setDoc(newPostRef, { ...postData, createdAt: serverTimestamp() }));
    return newPostRef.id;
  }

  async createNotification(userId: string, actorId: string, type: 'like' | 'comment' | 'follow', postId?: string, commentId?: string) {
    if (userId === actorId) return;
    const notificationRef = doc(collection(this.firebase.db, 'notifications'));
    const data: any = { userId, actorId, type, read: false, createdAt: serverTimestamp() };
    if (postId) data.postId = postId;
    if (commentId) data.commentId = commentId;
    await withTimeout(setDoc(notificationRef, data));
  }

  async getUserPosts(userId: string) {
    const q = query(collection(this.firebase.db, 'posts'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await withTimeout(getDocs(q));
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  async checkIsFollowing(followerId: string, followingId: string) {
    const followRef = doc(this.firebase.db, 'follows', `${followerId}_${followingId}`);
    const docSnap = await withTimeout(getDoc(followRef));
    return docSnap.exists();
  }

  async followUser(followerId: string, followingId: string) {
    const followRef = doc(this.firebase.db, 'follows', `${followerId}_${followingId}`);
    await withTimeout(setDoc(followRef, { followerId, followingId, createdAt: serverTimestamp() }));
    await withTimeout(updateDoc(doc(this.firebase.db, 'users', followerId), { followingCount: increment(1) }));
    await withTimeout(updateDoc(doc(this.firebase.db, 'users', followingId), { followersCount: increment(1) }));
    await this.createNotification(followingId, followerId, 'follow');
  }

  async unfollowUser(followerId: string, followingId: string) {
    const followRef = doc(this.firebase.db, 'follows', `${followerId}_${followingId}`);
    await withTimeout(deleteDoc(followRef));
    await withTimeout(updateDoc(doc(this.firebase.db, 'users', followerId), { followingCount: increment(-1) }));
    await withTimeout(updateDoc(doc(this.firebase.db, 'users', followingId), { followersCount: increment(-1) }));
  }

  async updateUserProfile(userId: string, data: any) {
    const userRef = doc(this.firebase.db, 'users', userId);
    await withTimeout(updateDoc(userRef, data));
  }

  async getComments(postId: string) {
    const q = query(collection(this.firebase.db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const snapshot = await withTimeout(getDocs(q));
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  async addComment(data: any) {
    const docRef = await withTimeout(addDoc(collection(this.firebase.db, 'comments'), { ...data, createdAt: serverTimestamp() }));
    await withTimeout(updateDoc(doc(this.firebase.db, 'posts', data.postId), { commentsCount: increment(1) }));
    const post = await this.getPost(data.postId);
    if (post) await this.createNotification(post.authorId, data.authorId, 'comment', data.postId, docRef.id);
    return docRef.id;
  }

  async likePost(userId: string, postId: string) {
    const likeRef = doc(this.firebase.db, 'likes', `${userId}_${postId}`);
    await withTimeout(setDoc(likeRef, { userId, postId, createdAt: serverTimestamp() }));
    await withTimeout(updateDoc(doc(this.firebase.db, 'posts', postId), { likesCount: increment(1) }));
    const post = await this.getPost(postId);
    if (post) await this.createNotification(post.authorId, userId, 'like', postId);
  }

  async unlikePost(userId: string, postId: string) {
    const likeRef = doc(this.firebase.db, 'likes', `${userId}_${postId}`);
    await withTimeout(deleteDoc(likeRef));
    await withTimeout(updateDoc(doc(this.firebase.db, 'posts', postId), { likesCount: increment(-1) }));
  }

  async getOrCreateConversation(userId1: string, userId2: string) {
    const q = query(collection(this.firebase.db, 'conversations'), where('participantIds', 'array-contains', userId1));
    const querySnapshot = await withTimeout(getDocs(q));
    for (const docSnap of querySnapshot.docs) {
      if ((docSnap.data() as any)['participantIds'].includes(userId2)) return docSnap.id;
    }
    const convRef = await withTimeout(addDoc(collection(this.firebase.db, 'conversations'), {
      participantIds: [userId1, userId2], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    }));
    return convRef.id;
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    await withTimeout(addDoc(collection(this.firebase.db, 'messages'), { conversationId, senderId, text, createdAt: serverTimestamp() }));
    await withTimeout(updateDoc(doc(this.firebase.db, 'conversations', conversationId), { lastMessage: text, lastMessageAt: serverTimestamp() }));
  }

  async markNotificationRead(notificationId: string) {
    await withTimeout(updateDoc(doc(this.firebase.db, 'notifications', notificationId), { read: true }));
  }

  async checkLiked(userId: string, postId: string): Promise<boolean> {
    const likeRef = doc(this.firebase.db, 'likes', `${userId}_${postId}`);
    const docSnap = await withTimeout(getDoc(likeRef));
    return docSnap.exists();
  }

  async getUserProfile(userId: string): Promise<any> {
    const docSnap = await withTimeout(getDoc(doc(this.firebase.db, 'users', userId)));
    return docSnap.exists() ? { uid: docSnap.id, ...(docSnap.data() as any) } : null;
  }
}
