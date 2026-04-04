import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DbService } from '../../services/db.service';
import { FirebaseService } from '../../services/firebase.service';
import { UserCacheService } from '../../services/user-cache.service';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, writeBatch } from 'firebase/firestore';
import { LucideAngularModule, Heart, MessageCircle, UserPlus, Bell } from 'lucide-angular';
import { formatDistanceToNow } from 'date-fns';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './notifications.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class Notifications implements OnInit, OnDestroy {
  notifications: any[] = [];
  loading = true;
  
  HeartIcon = Heart;
  MessageCircleIcon = MessageCircle;
  UserPlusIcon = UserPlus;
  BellIcon = Bell;

  private notifSub: any;

  constructor(
    public authService: AuthService,
    private dbService: DbService,
    private firebaseService: FirebaseService,
    private userCache: UserCacheService
  ) {}

  ngOnInit() {
    this.subscribeToNotifications();
  }

  ngOnDestroy() {
    if (this.notifSub) this.notifSub();
  }

  subscribeToNotifications() {
    const user = this.authService.user();
    if (!user) return;

    const q = query(
      collection(this.firebaseService.db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    this.notifSub = onSnapshot(q, async (snapshot) => {
      const notifs = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        let actor = null;
        if (data['actorId']) {
          actor = await this.userCache.getUserData(data['actorId']);
        }
        let post = null;
        if (data['postId']) {
          const postSnap = await getDoc(doc(this.firebaseService.db, 'posts', data['postId']));
          if (postSnap.exists()) post = postSnap.data();
        }
        return { id: d.id, ...data, actor, post };
      }));
      
      this.notifications = notifs;
      this.loading = false;
      
      const unreadDocs = snapshot.docs.filter(d => !d.data()['read']);
      if (unreadDocs.length > 0) {
        const batch = writeBatch(this.firebaseService.db);
        unreadDocs.forEach(d => {
          batch.update(d.ref, { read: true });
        });
        await batch.commit();
      }
    });
  }

  async markAsRead(notif: any) {
    if (!notif.read) {
      await this.dbService.markNotificationRead(notif.id);
    }
  }

  formatDate(timestamp: any) {
    if (timestamp?.toDate) {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }
    return 'Just now';
  }
}
