import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DbService } from '../../services/db.service';
import { SupabaseService } from '../../services/supabase.service';
import { LucideAngularModule, Settings, Grid, Bookmark, X, Camera } from 'lucide-angular';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseService } from '../../services/firebase.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './profile.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class Profile implements OnInit {
  id: string = '';
  profile: any = null;
  posts: any[] = [];
  loading = true;
  isFollowing = false;
  followLoading = false;
  isEditing = false;
  savingProfile = false;

  editForm = { username: '', displayName: '', bio: '', photoURL: '' };
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;

  SettingsIcon = Settings;
  GridIcon = Grid;
  BookmarkIcon = Bookmark;
  XIcon = X;
  CameraIcon = Camera;

  @ViewChild('fileInput') fileInputRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService,
    private dbService: DbService,
    private firebaseService: FirebaseService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id') || '';
      this.fetchProfileData();
    });
  }

  async fetchProfileData() {
    if (!this.id) return;
    this.loading = true;
    try {
      const docSnap = await getDoc(doc(this.firebaseService.db, 'users', this.id));
      if (docSnap.exists()) {
        this.profile = docSnap.data();
      }

      this.posts = await this.dbService.getUserPosts(this.id);
      
      const currentUser = this.authService.user();
      if (currentUser && currentUser.uid !== this.id) {
        this.isFollowing = await this.dbService.checkIsFollowing(currentUser.uid, this.id);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      this.loading = false;
    }
  }

  get isOwnProfile() {
    return this.authService.user()?.uid === this.id;
  }

  async handleFollowToggle() {
    const user = this.authService.user();
    if (!user || !this.id || this.followLoading) return;
    this.followLoading = true;
    try {
      if (this.isFollowing) {
        await this.dbService.unfollowUser(user.uid, this.id);
        this.isFollowing = false;
        if (this.profile) this.profile.followersCount = Math.max(0, (this.profile.followersCount || 0) - 1);
      } else {
        await this.dbService.followUser(user.uid, this.id);
        this.isFollowing = true;
        if (this.profile) this.profile.followersCount = (this.profile.followersCount || 0) + 1;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      this.followLoading = false;
    }
  }

  handleEditProfile() {
    this.editForm = {
      username: this.profile.username || '',
      displayName: this.profile.displayName || '',
      bio: this.profile.bio || '',
      photoURL: this.profile.photoURL || ''
    };
    this.profileImageFile = null;
    this.profileImagePreview = this.profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.profile.uid}`;
    this.isEditing = true;
  }

  handleImageChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.profileImageFile = file;
      this.profileImagePreview = URL.createObjectURL(file);
    }
  }

  async handleSaveProfile(event: Event) {
    event.preventDefault();
    const user = this.authService.user();
    if (!user || !this.id) return;
    
    this.savingProfile = true;
    try {
      let updatedPhotoURL = this.editForm.photoURL;

      if (this.profileImageFile) {
        const fileExt = this.profileImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `profiles/${user.uid}/${fileName}`;

        const { error } = await this.supabaseService.client.storage
          .from('images')
          .upload(filePath, this.profileImageFile, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: { publicUrl } } = this.supabaseService.client.storage
          .from('images').getPublicUrl(filePath);
          
        updatedPhotoURL = publicUrl;
      }

      const finalData = { ...this.editForm, photoURL: updatedPhotoURL };
      await this.dbService.updateUserProfile(user.uid, finalData);
      
      this.profile = { ...this.profile, ...finalData };
      this.isEditing = false;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      this.savingProfile = false;
    }
  }
}
