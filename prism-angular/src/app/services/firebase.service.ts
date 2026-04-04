import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

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
    // @ts-ignore
    this.db = getFirestore(this.app, firebaseConfig.firestoreDatabaseId);
    this.googleProvider = new GoogleAuthProvider();
  }
}
