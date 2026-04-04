import { Component } from '@angular/core';
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
    private router: Router
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
    try {
      if (this.isLogin) {
        await signInWithEmailAndPassword(this.firebaseService.auth, this.email, this.password);
      } else {
        await createUserWithEmailAndPassword(this.firebaseService.auth, this.email, this.password);
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = this.getFriendlyError(err.code || err.message);
    } finally {
      this.loading = false;
    }
  }

  async handleGoogleAuth() {
    if (this.loading) return;
    this.error = '';
    this.loading = true;
    try {
      await signInWithPopup(this.firebaseService.auth, this.firebaseService.googleProvider);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = this.getFriendlyError(err.code || err.message);
    } finally {
      this.loading = false;
    }
  }

  async handleForgotPassword() {
    if (!this.email) {
      this.error = 'Please enter your email address first.';
      return;
    }
    try {
      await sendPasswordResetEmail(this.firebaseService.auth, this.email);
      this.successMessage = 'Password reset email sent! Check your inbox.';
      this.error = '';
    } catch (err: any) {
      this.error = this.getFriendlyError(err.code || err.message);
    }
  }

  private getFriendlyError(code: string): string {
    const errors: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    return errors[code] || code;
  }
}
