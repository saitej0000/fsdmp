import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostCardComponent } from '../../components/ui/post-card.component';
import { MasonryGridComponent } from '../../components/ui/masonry-grid.component';
import { DbService } from '../../services/db.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PostCardComponent, MasonryGridComponent],
  templateUrl: './home.component.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
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

  constructor(private dbService: DbService) {}

  ngOnInit() {
    this.fetchInitialPosts();
  }

  async fetchInitialPosts() {
    try {
      this.loading = true;
      const data = await this.dbService.getPosts();
      this.posts = data.posts;
      this.lastDoc = data.lastDoc;
      this.hasMore = !!data.lastDoc;
    } catch (error) {
      console.error('Error fetching posts:', error);
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
