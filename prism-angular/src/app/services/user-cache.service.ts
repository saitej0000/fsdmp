import { Injectable } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class UserCacheService {
  private userCache = new Map<string, any>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(private firebaseService: FirebaseService) {}

  async getUserData(userId: string) {
    if (!userId) return null;
    
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }

    if (this.pendingRequests.has(userId)) {
      return this.pendingRequests.get(userId);
    }

    const fetchPromise = (async () => {
      try {
        const docRef = doc(this.firebaseService.db, 'users', userId);
        const timeout = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('User fetch timeout')), 8000)
        );
        const docSnap = await Promise.race([getDoc(docRef), timeout]) as any;
        if (docSnap && docSnap.exists && docSnap.exists()) {
          const data = docSnap.data();
          this.userCache.set(userId, data);
          return data;
        }
        return null;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      } finally {
        this.pendingRequests.delete(userId);
      }
    })();

    this.pendingRequests.set(userId, fetchPromise);
    return fetchPromise;
  }

  clearUserCache() {
    this.userCache.clear();
  }
}
