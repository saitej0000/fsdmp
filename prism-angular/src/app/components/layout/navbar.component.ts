import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Home, Compass, PlusSquare, User, LogOut, Moon, Sun, Search, Heart, MessageCircle } from 'lucide-angular';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  isDark = true;
  unreadCount = 0;

  // Icons used in template
  HomeIcon = Home;
  CompassIcon = Compass;
  PlusSquareIcon = PlusSquare;
  UserIcon = User;
  LogOutIcon = LogOut;
  MoonIcon = Moon;
  SunIcon = Sun;
  SearchIcon = Search;
  HeartIcon = Heart;
  MessageCircleIcon = MessageCircle;

  constructor(public authService: AuthService, private firebaseService: FirebaseService) {
    effect(() => {
      const user = this.authService.user();
      if (user) {
        const q = query(
          collection(this.firebaseService.db, 'notifications'),
          where('userId', '==', user.uid),
          where('read', '==', false)
        );
        onSnapshot(q, (snapshot) => {
          this.unreadCount = snapshot.docs.length;
        });
      }
    });

    this.applyTheme();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
  }

  applyTheme() {
    if (this.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  logout() {
    this.firebaseService.auth.signOut();
  }
}
