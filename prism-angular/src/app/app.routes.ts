import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

// Import Pages
import { AuthComponent } from './pages/auth/auth.component';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { Explore } from './pages/explore/explore';
import { PostDetail } from './pages/post-detail/post-detail';
import { Upload } from './pages/upload/upload';
import { Messages } from './pages/messages/messages';
import { Notifications } from './pages/notifications/notifications';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [publicGuard]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'explore', component: Explore },
      { path: 'post/:id', component: PostDetail },
      { path: 'upload', component: Upload },
      { path: 'messages', component: Messages },
      { path: 'messages/:id', component: Messages },
      { path: 'notifications', component: Notifications },
      { path: 'profile/:id', component: Profile },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
