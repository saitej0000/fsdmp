import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasonryGridComponent } from '../../components/ui/masonry-grid.component';
import { DbService } from '../../services/db.service';
import { LucideAngularModule, Search } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, MasonryGridComponent, LucideAngularModule],
  templateUrl: './explore.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class Explore implements OnInit {
  posts: any[] = [];
  loading = true;
  loadingMore = false;
  lastDoc: any = null;
  hasMore = true;
  searchQuery = '';

  SearchIcon = Search;
  tags = ['Photography', 'Art', 'Design', 'Nature', 'Architecture', 'Fashion', 'Travel'];

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

  get filteredPosts() {
    if (!this.searchQuery) return this.posts;
    return this.posts.filter(post => 
      post.caption?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  setTag(tag: string) {
    this.searchQuery = tag;
  }
}
