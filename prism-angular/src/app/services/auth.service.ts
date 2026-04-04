import { Injectable, signal, computed } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Using Angular Signals for reactive state
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
        const docRef = doc(this.firebaseService.db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          this.profile.set(docSnap.data() as UserProfile);
        } else {
          // Create new profile
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
          await setDoc(docRef, newProfile);
          this.profile.set(newProfile);
        }
      } else {
        this.profile.set(null);
      }
      this.loading.set(false);
    });
  }
}
