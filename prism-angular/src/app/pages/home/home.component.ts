import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostCardComponent } from '../../components/ui/post-card.component';
import { DbService } from '../../services/db.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { LucideAngularModule, Camera } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PostCardComponent, LucideAngularModule],
  templateUrl: './home.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {
  // All state as Signals for zoneless change detection
  posts = signal<any[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  error = signal<string | null>(null);
  lastDoc = signal<any>(null);

  CameraIcon = Camera;

  constructor(private dbService: DbService) {}

  ngOnInit() {
    this.fetchInitialPosts();
  }

  async fetchInitialPosts() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.dbService.getPosts();
      this.posts.set(data.posts);
      this.lastDoc.set(data.lastDoc);
      this.hasMore.set(!!data.lastDoc);
    } catch (err: any) {
      this.error.set(err?.message || 'Could not load posts. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadMorePosts() {
    if (this.loadingMore() || !this.hasMore() || !this.lastDoc()) return;
    try {
      this.loadingMore.set(true);
      const data = await this.dbService.getPosts(this.lastDoc());
      if (data.posts.length === 0) {
        this.hasMore.set(false);
      } else {
        this.posts.update(existing => [...existing, ...data.posts]);
        this.lastDoc.set(data.lastDoc);
        this.hasMore.set(!!data.lastDoc);
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      this.loadingMore.set(false);
    }
  }
}
