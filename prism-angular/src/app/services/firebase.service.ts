import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../environments/firebase-applet-config.json';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  googleProvider: GoogleAuthProvider;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    // Use the default Firestore database '(default)' — the named AI Studio
    // database (firestoreDatabaseId) is a private AI Studio db and not suitable
    // for app data. The default database is where your app's data should live.
    this.db = getFirestore(this.app);
    this.googleProvider = new GoogleAuthProvider();
  }
}
