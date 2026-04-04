import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
  isLogin = true;
  email = '';
  password = '';
  error = '';
  successMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.successMessage = '';
  }

  async handleAuth(e: Event) {
    e.preventDefault();
    if (this.loading) return;
    this.error = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.detectChanges();
    try {
      if (this.isLogin) {
        await withAuthTimeout(
          signInWithEmailAndPassword(this.firebaseService.auth, this.email, this.password)
        );
      } else {
        await withAuthTimeout(
          createUserWithEmailAndPassword(this.firebaseService.auth, this.email, this.password)
        );
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = this.getFriendlyError(err.code || err.message || String(err));
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async handleGoogleAuth() {
    if (this.loading) return;
    this.error = '';
    this.loading = true;
    this.cdr.detectChanges();
    try {
      await withAuthTimeout(
        signInWithPopup(this.firebaseService.auth, this.firebaseService.googleProvider),
        15000
      );
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = this.getFriendlyError(err.code || err.message || String(err));
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async handleForgotPassword() {
    if (!this.email) {
      this.error = 'Please enter your email address first.';
      this.cdr.detectChanges();
      return;
    }
    try {
      await withAuthTimeout(sendPasswordResetEmail(this.firebaseService.auth, this.email));
      this.successMessage = 'Password reset email sent! Check your inbox.';
      this.error = '';
    } catch (err: any) {
      this.error = this.getFriendlyError(err.code || err.message || String(err));
    } finally {
      this.cdr.detectChanges();
    }
  }

  private getFriendlyError(code: string): string {
    const errors: Record<string, string> = {
      'auth/timeout': 'Connection timed out. Firebase Auth may not be enabled for this project.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/unauthorized-domain': 'This domain is not authorized. Add it to Firebase Console → Authentication → Authorized domains.',
      'auth/operation-not-allowed': 'Email/password sign-in not enabled. Go to Firebase Console → Authentication → Sign-in method.',
    };
    return errors[code] ?? `Error: ${code}`;
  }
}
