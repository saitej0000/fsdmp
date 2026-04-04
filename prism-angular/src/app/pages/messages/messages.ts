import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DbService } from '../../services/db.service';
import { FirebaseService } from '../../services/firebase.service';
import { UserCacheService } from '../../services/user-cache.service';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { LucideAngularModule, Send, MessageCircle, Search } from 'lucide-angular';
import { format, formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './messages.html'
})
export class Messages implements OnInit, OnDestroy {
  targetUserId: string | null = null;
  conversations: any[] = [];
  activeConversationId: string | null = null;
  messages: any[] = [];
  newMessage = '';
  targetUser: any = null;
  searchQuery = '';
  
  SendIcon = Send;
  MessageCircleIcon = MessageCircle;
  SearchIcon = Search;

  @ViewChild('messagesEnd') messagesEndRef!: ElementRef;

  private convosSub: any;
  private msgsSub: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private dbService: DbService,
    private firebaseService: FirebaseService,
    private userCache: UserCacheService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.targetUserId = params.get('id');
      this.initDirectMessage();
    });

    this.subscribeToConversations();
  }

  ngOnDestroy() {
    if (this.convosSub) this.convosSub();
    if (this.msgsSub) this.msgsSub();
  }

  subscribeToConversations() {
    const user = this.authService.user();
    if (!user) return;

    const q = query(
      collection(this.firebaseService.db, 'conversations'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    this.convosSub = onSnapshot(q, async (snapshot) => {
      const convos = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const otherUserId = data['participantIds'].find((id: string) => id !== user.uid);
        let otherUser = null;
        if (otherUserId) {
          otherUser = await this.userCache.getUserData(otherUserId);
        }
        return { id: d.id, ...data, otherUser };
      }));
      this.conversations = convos;
    });
  }

  async initDirectMessage() {
    const user = this.authService.user();
    if (user && this.targetUserId) {
      const convId = await this.dbService.getOrCreateConversation(user.uid, this.targetUserId);
      this.activeConversationId = convId;
      
      const userData = await this.userCache.getUserData(this.targetUserId);
      if (userData) {
        this.targetUser = userData;
      }
      this.subscribeToMessages(convId);
    } else {
      this.activeConversationId = null;
      this.targetUser = null;
      if (this.msgsSub) {
        this.msgsSub();
        this.msgsSub = null;
      }
      this.messages = [];
    }
  }

  subscribeToMessages(convId: string) {
    if (this.msgsSub) this.msgsSub();
    
    const q = query(
      collection(this.firebaseService.db, 'messages'),
      where('conversationId', '==', convId),
      orderBy('createdAt', 'asc')
    );

    this.msgsSub = onSnapshot(q, (snapshot) => {
      this.messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTimeout(() => {
        this.messagesEndRef?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  selectConversation(conv: any) {
    this.activeConversationId = conv.id;
    this.targetUser = conv.otherUser;
    this.router.navigate(['/messages', conv.otherUser?.uid]);
  }

  async handleSendMessage(e: Event) {
    e.preventDefault();
    const user = this.authService.user();
    if (!user || !this.activeConversationId || !this.newMessage.trim()) return;
    
    const text = this.newMessage.trim();
    this.newMessage = '';
    
    try {
      await this.dbService.sendMessage(this.activeConversationId, user.uid, text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  get filteredConversations() {
    return this.conversations.filter(conv => {
      if (!this.searchQuery.trim()) return true;
      const searchLower = this.searchQuery.toLowerCase();
      const username = conv.otherUser?.username?.toLowerCase() || '';
      const displayName = conv.otherUser?.displayName?.toLowerCase() || '';
      return username.includes(searchLower) || displayName.includes(searchLower);
    });
  }

  goBackToSearch() {
    this.activeConversationId = null;
    this.router.navigate(['/messages']);
  }

  formatTimestamp(timestamp: any, formatStr: string) {
    if (!timestamp?.toDate) return '';
    return format(timestamp.toDate(), formatStr);
  }

  formatDistance(timestamp: any) {
    if (!timestamp?.toDate) return '';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: false }).replace('about ', '');
  }

  shouldShowTimestamp(msg: any, index: number): boolean {
    const prevMsg = this.messages[index - 1];
    return index === 0 || 
      (msg.createdAt?.seconds && prevMsg?.createdAt?.seconds && 
       msg.createdAt.seconds - prevMsg.createdAt.seconds > 3600);
  }
}
