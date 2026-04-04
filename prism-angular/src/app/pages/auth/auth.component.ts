import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

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

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.error = '';
  }

  async handleAuth(e: Event) {
    e.preventDefault();
    this.error = '';
    try {
      if (this.isLogin) {
        // @ts-ignore
        await signInWithEmailAndPassword(this.authService['firebaseService'].auth, this.email, this.password);
      } else {
        // @ts-ignore
        await createUserWithEmailAndPassword(this.authService['firebaseService'].auth, this.email, this.password);
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.message;
    }
  }

  async handleGoogleAuth() {
    try {
      // @ts-ignore
      await signInWithPopup(this.authService['firebaseService'].auth, this.authService['firebaseService'].googleProvider);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.message;
    }
  }
}
