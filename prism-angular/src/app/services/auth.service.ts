import { Injectable, signal } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  photoURL: string;
  followersCount: number;
  followingCount: number;
  createdAt: any;
}

function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  ]);
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly user = signal<FirebaseUser | null>(null);
  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal<boolean>(true);

  constructor(private firebaseService: FirebaseService) {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(this.firebaseService.auth, async (currentUser) => {
      this.user.set(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(this.firebaseService.db, 'users', currentUser.uid);
          // 5-second timeout — if Firestore hangs, we still mark loading as done
          const docSnap = await withTimeout(getDoc(docRef), 5000);

          if (docSnap && (docSnap as any).exists && (docSnap as any).exists()) {
            this.profile.set((docSnap as any).data() as UserProfile);
          } else {
            // Either timed out or doc doesn't exist — create profile
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'New User',
              username: `user_${currentUser.uid.substring(0, 6)}`,
              bio: '',
              photoURL: currentUser.photoURL || '',
              followersCount: 0,
              followingCount: 0,
              createdAt: serverTimestamp(),
            };
            // Fire-and-forget the setDoc — don't await it
            setDoc(docRef, newProfile).catch(() => {});
            this.profile.set(newProfile);
          }
        } catch {
          // Any error — set minimal profile so app doesn't break
          this.profile.set({
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'User',
            username: `user_${currentUser.uid.substring(0, 6)}`,
            bio: '', photoURL: currentUser.photoURL || '',
            followersCount: 0, followingCount: 0, createdAt: null,
          });
        }
      } else {
        this.profile.set(null);
      }

      // Always mark loading done regardless of Firestore result
      this.loading.set(false);
    });
  }
}
