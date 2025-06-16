import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentIdeaService, ContentIdea } from '../services/content-idea.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="favorites-container">
      <h2>Favorite Ideas</h2>
      <div class="favorites-grid">
        <mat-card *ngFor="let idea of favorites" class="idea-card">
          <mat-card-header>
            <mat-card-title>{{ idea.title }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip>{{ idea.type }}</mat-chip>
              <mat-chip>{{ idea.niche }}</mat-chip>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{ idea.description }}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="warn" (click)="removeFromFavorites(idea)">
              <mat-icon>delete</mat-icon>
              Remove
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .favorites-container {
      padding: 20px;
    }
    .favorites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .idea-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    mat-card-content {
      flex-grow: 1;
    }
    mat-card-actions {
      padding: 8px;
      display: flex;
      justify-content: flex-end;
    }
    mat-chip {
      margin: 4px;
    }
  `]
})
export class FavoritesComponent implements OnInit {
  favorites: ContentIdea[] = [];

  constructor(private contentIdeaService: ContentIdeaService) {}

  ngOnInit() {
    this.loadFavorites();
  }

  async loadFavorites() {
    try {
      this.favorites = await this.contentIdeaService.getFavorites();
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async removeFromFavorites(idea: ContentIdea) {
    if (idea.id) {
      try {
        await this.contentIdeaService.removeFromFavorites(idea.id);
        await this.loadFavorites(); // Reload the list after removal
      } catch (error) {
        console.error('Error removing from favorites:', error);
      }
    }
  }
} 