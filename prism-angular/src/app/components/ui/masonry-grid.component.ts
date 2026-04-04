import { Component, Input, Output, EventEmitter, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Heart, MessageCircle } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  dominantColor?: string;
  likesCount: number;
  commentsCount: number;
}

@Component({
  selector: 'app-lazy-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full relative" #container>
      <img *ngIf="isInView"
        [src]="src"
        [alt]="alt"
        [class]="className + ' transition-opacity duration-500 ' + (isLoaded ? 'opacity-100' : 'opacity-0')"
        (load)="onLoad()"
      />
      <div *ngIf="!isLoaded" class="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
    </div>
  `
})
export class LazyImageComponent implements AfterViewInit {
  @Input() src!: string;
  @Input() alt!: string;
  @Input() className!: string;

  isLoaded = false;
  isInView = false;
  private observer: IntersectionObserver | null = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.isInView = true;
        this.observer?.disconnect();
      }
    }, { rootMargin: '200px' });
    this.observer.observe(this.el.nativeElement);
  }

  onLoad() {
    this.isLoaded = true;
  }
}

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, LazyImageComponent],
  templateUrl: './masonry-grid.component.html',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class MasonryGridComponent implements AfterViewInit {
  @Input() posts: Post[] = [];
  @Input() hasMore: boolean = true;
  @Input() loadingMore: boolean = false;
  @Output() loadMore = new EventEmitter<void>();

  @ViewChildren('postElement') postElements!: QueryList<ElementRef>;
  private observer: IntersectionObserver | null = null;

  HeartIcon = Heart;
  MessageCircleIcon = MessageCircle;

  constructor() {}

  ngAfterViewInit() {
    this.setupObserver();
    this.postElements.changes.subscribe(() => {
      this.setupObserver();
    });
  }

  setupObserver() {
    if (this.loadingMore) return;
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && this.hasMore) {
        this.loadMore.emit();
      }
    });

    const lastElement = this.postElements.last;
    if (lastElement) {
      this.observer.observe(lastElement.nativeElement);
    }
  }
}
