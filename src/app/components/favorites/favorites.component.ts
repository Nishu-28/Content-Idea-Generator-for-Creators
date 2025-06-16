import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentIdeaService, ContentIdea } from '../../services/content-idea.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AuthService } from '../../services/auth.service';
import { GoogleDocsService } from '../../services/google-docs.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="favorites-container">
      <div style="display: flex; gap: 12px; margin-bottom: 16px;" *ngIf="authService.currentUser">
        <button mat-raised-button color="primary" (click)="exportAsPDF()">
          Export as PDF
        </button>
        <button mat-raised-button color="accent" (click)="exportToGoogleDocs()">
          Export to Google Docs
        </button>
      </div>
      <div *ngIf="!authService.currentUser" style="margin: 32px 0; text-align: center; color: #888; font-size: 1.2em;">
        Log in to see your favorites.
      </div>
      <div *ngIf="authService.currentUser" id="favorites-list-pdf-content">
        <h2>Favorite Ideas</h2>
        <div *ngFor="let date of sortedDates">
          <h3 style="margin-top: 32px; margin-bottom: 12px;">{{ date }}</h3>
          <div class="favorites-grid">
            <mat-card *ngFor="let idea of groupedFavorites[date]" class="idea-card">
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
      background: #232025;
      color: #fff;
    }
    mat-card-title, .idea-card mat-card-title {
      color: #fff !important;
      font-weight: bold;
    }
    mat-card-subtitle, .idea-card mat-card-subtitle {
      color: #e0e0e0 !important;
    }
    mat-card-content, .idea-card mat-card-content {
      color: #f5f5f5 !important;
    }
    mat-chip {
      margin: 4px;
      background: #333;
      color: #fff;
      font-weight: 500;
    }
    mat-card-actions {
      padding: 8px;
      display: flex;
      justify-content: flex-end;
    }
    button[mat-button] {
      color: #e1bee7;
    }
    mat-icon {
      color: #e1bee7;
    }
  `]
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: ContentIdea[] = [];
  groupedFavorites: { [date: string]: ContentIdea[] } = {};
  sortedDates: string[] = [];
  private userSub?: Subscription;

  constructor(
    private contentIdeaService: ContentIdeaService,
    public authService: AuthService,
    private googleDocsService: GoogleDocsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.userSub = this.authService.user$.subscribe(() => {
      this.loadFavorites();
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }

  async loadFavorites() {
    try {
      const favs = await this.contentIdeaService.getFavorites();
      // Sort by timestamp descending
      this.favorites = favs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      // Group by date
      this.groupedFavorites = {};
      this.favorites.forEach(fav => {
        const date = fav.timestamp ? new Date(fav.timestamp).toLocaleDateString() : 'Unknown Date';
        if (!this.groupedFavorites[date]) this.groupedFavorites[date] = [];
        this.groupedFavorites[date].push(fav);
      });
      this.sortedDates = Object.keys(this.groupedFavorites).sort((a, b) => {
        // Sort dates descending (most recent first)
        return new Date(b).getTime() - new Date(a).getTime();
      });
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

  async exportAsPDF() {
    const pdf = new jsPDF();
    let y = 15;
    pdf.setFontSize(18);
    pdf.text('Favorite Ideas', 10, y);
    y += 10;
    pdf.setFontSize(11);
    pdf.text(`Exported: ${new Date().toLocaleDateString()}`, 10, y);
    y += 10;
    this.favorites.forEach((idea, idx) => {
      if (y > 270) { pdf.addPage(); y = 15; }
      pdf.setFontSize(14);
      pdf.text(`${idx + 1}. ${idea.title}`, 10, y);
      y += 8;
      pdf.setFontSize(11);
      const dateStr = idea.timestamp ? new Date(idea.timestamp).toLocaleDateString() : 'N/A';
      pdf.text(`Type: ${idea.type}   Niche: ${idea.niche}   Added: ${dateStr}`, 12, y);
      y += 7;
      const splitDesc = pdf.splitTextToSize(idea.description, 180);
      pdf.text(splitDesc, 14, y);
      y += splitDesc.length * 6 + 6;
    });
    pdf.save('favorites-list.pdf');
  }

  async exportToGoogleDocs() {
    try {
      const title = 'Favorite Ideas';
      const today = new Date();
      const dateStr = today.toLocaleDateString();
      const content: string[] = [
        `${title}\nExported: ${dateStr}\n`,
        ...this.sortedDates.flatMap(date => [
          `Date: ${date}\n`,
          ...this.groupedFavorites[date].map((idea, idx) =>
            `${idx + 1}. ${idea.title}\nType: ${idea.type}   Niche: ${idea.niche}\n${idea.description}\n`)
        ])
      ];
      const url = await this.googleDocsService.exportToGoogleDoc(title, content);
      this.snackBar.open('Exported to Google Docs!', 'Open', { duration: 5000 })
        .onAction().subscribe(() => window.open(url, '_blank'));
    } catch (err: any) {
      this.snackBar.open('Failed to export to Google Docs: ' + (err.message || err), 'Close', { duration: 5000 });
    }
  }
}
