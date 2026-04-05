import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';

function withAuthTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('auth/timeout')), ms)
    )
  ]);
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  // Using Signals for reactive state in zoneless Angular
  isLogin = signal(true);
  email = signal('');
  password = signal('');
  error = signal('');
  successMessage = signal('');
  loading = signal(false);

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set('');
    this.successMessage.set('');
  }

  async handleAuth(e: Event) {
    e.preventDefault();
    if (this.loading()) return;
    this.error.set('');
    this.successMessage.set('');
    this.loading.set(true);
    try {
      if (this.isLogin()) {
        await withAuthTimeout(
          signInWithEmailAndPassword(this.firebaseService.auth, this.email(), this.password())
        );
      } else {
        await withAuthTimeout(
          createUserWithEmailAndPassword(this.firebaseService.auth, this.email(), this.password())
        );
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set(this.getFriendlyError(err.code || err.message || String(err)));
      this.loading.set(false);
    }
  }

  async handleGoogleAuth() {
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    try {
      await withAuthTimeout(
        signInWithPopup(this.firebaseService.auth, this.firebaseService.googleProvider),
        15000
      );
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set(this.getFriendlyError(err.code || err.message || String(err)));
      this.loading.set(false);
    }
  }

  async handleForgotPassword() {
    if (!this.email()) {
      this.error.set('Please enter your email address first.');
      return;
    }
    try {
      await withAuthTimeout(sendPasswordResetEmail(this.firebaseService.auth, this.email()));
      this.successMessage.set('Password reset email sent! Check your inbox.');
      this.error.set('');
    } catch (err: any) {
      this.error.set(this.getFriendlyError(err.code || err.message || String(err)));
    }
  }

  private getFriendlyError(code: string): string {
    const errors: Record<string, string> = {
      'auth/timeout': 'Connection timed out. Check Firebase Console: Authentication must be enabled and this domain must be in Authorized Domains.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your internet connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/unauthorized-domain': 'This domain is not authorized. Add it to Firebase Console → Authentication → Settings → Authorized domains.',
      'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method.',
    };
    return errors[code] ?? `Error: ${code}`;
  }
}
