import { Component, OnInit } from '@angular/core';
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
  posts: any[] = [];
  loading = true;
  loadingMore = false;
  lastDoc: any = null;
  hasMore = true;
  error: string | null = null;

  CameraIcon = Camera;

  constructor(private dbService: DbService) {}

  ngOnInit() {
    this.fetchInitialPosts();
  }

  async fetchInitialPosts() {
    try {
      this.loading = true;
      this.error = null;
      const data = await this.dbService.getPosts();
      this.posts = data.posts;
      this.lastDoc = data.lastDoc;
      this.hasMore = !!data.lastDoc;
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      this.error = error?.message || 'Could not load posts. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async loadMorePosts() {
    if (this.loadingMore || !this.hasMore || !this.lastDoc) return;
    try {
      this.loadingMore = true;
      const data = await this.dbService.getPosts(this.lastDoc);
      if (data.posts.length === 0) {
        this.hasMore = false;
      } else {
        this.posts = [...this.posts, ...data.posts];
        this.lastDoc = data.lastDoc;
        this.hasMore = !!data.lastDoc;
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      this.loadingMore = false;
    }
  }
}
