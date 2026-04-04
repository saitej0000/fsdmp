import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DbService } from '../../services/db.service';
import { UserCacheService } from '../../services/user-cache.service';
import { FirebaseService } from '../../services/firebase.service';
import { doc, getDoc } from 'firebase/firestore';
import { LucideAngularModule, Heart, MessageCircle, ArrowLeft, Send, MoreHorizontal, Bookmark } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './post-detail.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('heartAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0)', opacity: 0 }),
        animate('300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ transform: 'scale(1.5)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'scale(0)', opacity: 0 }))
      ])
    ])
  ]
})
export class PostDetail implements OnInit {
  id: string = '';
  post: any = null;
  author: any = null;
  comments: any[] = [];
  newComment = '';
  isLiked = false;
  loading = true;
  showHeart = false;

  HeartIcon = Heart;
  MessageCircleIcon = MessageCircle;
  ArrowLeftIcon = ArrowLeft;
  SendIcon = Send;
  MoreHorizontalIcon = MoreHorizontal;
  BookmarkIcon = Bookmark;

  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private dbService: DbService,
    private userCache: UserCacheService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id') || '';
      this.fetchPostData();
    });
  }

  async fetchPostData() {
    if (!this.id) return;
    this.loading = true;
    try {
      const postData = await this.dbService.getPost(this.id);
      if (postData) {
        this.post = postData;
        
        const authorData = await this.userCache.getUserData(postData['authorId']);
        if (authorData) this.author = authorData;
        
        const commentsData = await this.dbService.getComments(this.id);
        this.comments = await Promise.all(commentsData.map(async (c: any) => {
          const userData = await this.userCache.getUserData(c.authorId);
          return { ...c, user: userData };
        }));

        const user = this.authService.user();
        if (user) {
          const likeDoc = await getDoc(doc(this.firebaseService.db, 'likes', `${user.uid}_${this.id}`));
          this.isLiked = likeDoc.exists();
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      this.loading = false;
    }
  }

  async handleDoubleTap() {
    if (!this.isLiked) {
      await this.handleLike();
    }
    this.showHeart = true;
    setTimeout(() => this.showHeart = false, 1000);
  }

  async handleLike() {
    const user = this.authService.user();
    if (!user || !this.post) {
      this.router.navigate(['/auth']);
      return;
    }
    try {
      if (this.isLiked) {
        await this.dbService.unlikePost(user.uid, this.post.id);
        this.post.likesCount = Math.max(0, this.post.likesCount - 1);
      } else {
        await this.dbService.likePost(user.uid, this.post.id);
        this.post.likesCount++;
      }
      this.isLiked = !this.isLiked;
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  async handleComment(e: Event) {
    e.preventDefault();
    const user = this.authService.user();
    if (!user || !this.post || !this.newComment.trim()) return;
    try {
      const commentData = {
        postId: this.post.id,
        authorId: user.uid,
        text: this.newComment.trim(),
      };
      const commentId = await this.dbService.addComment(commentData);
      const userData = await this.userCache.getUserData(user.uid);
      
      this.comments.push({ 
        id: commentId, 
        ...commentData, 
        user: userData, 
        createdAt: { toDate: () => new Date() } 
      });
      this.post.commentsCount++;
      this.newComment = '';
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  goBack() {
    window.history.back();
  }

  formatDate(timestamp: any): string {
    if (timestamp?.toDate) {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }
    return 'Just now';
  }
}
