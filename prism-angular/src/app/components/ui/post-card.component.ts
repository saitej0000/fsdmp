import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserCacheService } from '../../services/user-cache.service';
import { formatDistanceToNow } from 'date-fns';
import { LucideAngularModule, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-angular';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './post-card.component.html',
})
export class PostCardComponent implements OnInit {
  @Input() post: any;
  author: any = null;
  timeAgo: string = 'Just now';

  // Icons
  HeartIcon = Heart;
  MessageCircleIcon = MessageCircle;
  SendIcon = Send;
  BookmarkIcon = Bookmark;
  MoreHorizontalIcon = MoreHorizontal;

  constructor(private userCache: UserCacheService) {}

  ngOnInit() {
    this.fetchAuthor();
    if (this.post?.createdAt?.toDate) {
      this.timeAgo = formatDistanceToNow(this.post.createdAt.toDate(), { addSuffix: true });
    }
  }

  async fetchAuthor() {
    if (!this.post?.authorId) return;
    const data = await this.userCache.getUserData(this.post.authorId);
    if (data) {
      this.author = data;
    }
  }
}
