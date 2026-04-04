import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DbService } from '../../services/db.service';
import { SupabaseService } from '../../services/supabase.service';
import { LucideAngularModule, UploadCloud, Image as ImageIcon, X } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './upload.html',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class Upload {
  file: File | null = null;
  preview: string | null = null;
  caption = '';
  uploading = false;
  isDragActive = false;

  ImageIcon = ImageIcon;
  XIcon = X;

  constructor(
    public authService: AuthService,
    private dbService: DbService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragActive = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragActive = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragActive = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type.startsWith('image/')) {
      this.file = file;
      this.preview = URL.createObjectURL(file);
    }
  }

  clearFile() {
    this.file = null;
    this.preview = null;
  }

  async handleUpload() {
    const user = this.authService.user();
    if (!this.file || !user) return;

    this.uploading = true;
    
    try {
      const fileExt = this.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      const { error } = await this.supabaseService.client.storage
        .from('images')
        .upload(filePath, this.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = this.supabaseService.client.storage
        .from('images')
        .getPublicUrl(filePath);

      const dominantColor = ['#ff7eb3', '#ff758c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'][Math.floor(Math.random() * 6)];

      await this.dbService.createPost({
        authorId: user.uid,
        imageUrl: publicUrl,
        caption: this.caption,
        dominantColor,
        likesCount: 0,
        commentsCount: 0,
      });

      this.uploading = false;
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Error starting upload:', err);
      this.uploading = false;
      
      if (err.message === 'Bucket not found' || err.message.includes('Bucket not found')) {
        alert('Supabase Bucket Not Found!\n\nPlease go to your Supabase Dashboard:\n1. Click "Storage" on the left menu.\n2. Click "New Bucket".\n3. Name it exactly "images".\n4. Toggle "Public bucket" to ON.\n5. Click Save and try uploading again.');
      } else {
        alert(`Failed to upload: ${err.message}. Please ensure you have configured Supabase URL and Anon Key in the environment variables, and created a public 'images' bucket.`);
      }
    }
  }
}
