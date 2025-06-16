import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentIdea, ContentIdeaService } from '../../services/content-idea.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { GoogleDocsService } from '../../services/google-docs.service';

@Component({
  selector: 'app-ideas-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="ideas-list-container">
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <button mat-raised-button color="primary" (click)="exportAsPDF()">
          Export as PDF
        </button>
        <button mat-raised-button color="accent" (click)="exportToGoogleDocs()">
          Export to Google Docs
        </button>
      </div>
      <div id="ideas-list-pdf-content">
        <mat-card *ngFor="let idea of ideas" class="idea-card">
          <mat-card-header>
            <mat-card-title>{{ idea.title }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip>{{ idea.type }}</mat-chip>
              <mat-chip>{{ idea.niche }}</mat-chip>
            </mat-card-subtitle>
            <button mat-icon-button color="accent" (click)="toggleFavorite(idea)" aria-label="Toggle Favorite" style="margin-left:auto;">
              <mat-icon>{{ isFavorite(idea) ? 'star' : 'star_border' }}</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            <p>{{ idea.description }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .ideas-list-container {
      padding: 20px;
    }
    #ideas-list-pdf-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .idea-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #232025;
      color: #fff;
      margin-bottom: 0;
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
    mat-card-header {
      display: flex;
      align-items: center;
    }
    button[mat-icon-button] {
      margin-left: auto;
    }
  `]
})
export class IdeasListComponent implements OnInit, OnChanges {
  @Input() ideas: ContentIdea[] = [];
  @Output() favoriteAdded = new EventEmitter<void>();

  favoriteTitles = new Set<string>();
  favoriteMap = new Map<string, string>(); // key: title|type|niche, value: favorite id

  constructor(
    private contentIdeaService: ContentIdeaService,
    private snackBar: MatSnackBar,
    public authService: AuthService,
    private googleDocsService: GoogleDocsService
  ) {}

  async ngOnInit() {
    await this.loadFavorites();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['ideas']) {
      await this.loadFavorites();
    }
  }

  async loadFavorites() {
    try {
      const favorites = await this.contentIdeaService.getFavorites();
      this.favoriteTitles = new Set(favorites.map(fav => `${fav.title}|${fav.type}|${fav.niche}`));
      this.favoriteMap = new Map(favorites.map(fav => [`${fav.title}|${fav.type}|${fav.niche}`, fav.id || '']));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  isFavorite(idea: ContentIdea): boolean {
    return this.favoriteTitles.has(`${idea.title}|${idea.type}|${idea.niche}`);
  }

  async toggleFavorite(idea: ContentIdea) {
    const user = this.authService.currentUser;
    if (!user) {
      this.snackBar.open('Please log in to continue using this feature.', 'Close', { duration: 3000 });
      return;
    }
    const key = `${idea.title}|${idea.type}|${idea.niche}`;
    if (this.isFavorite(idea)) {
      // Remove from favorites
      const favId = this.favoriteMap.get(key);
      if (favId) {
        await this.contentIdeaService.removeFromFavorites(favId);
        await this.loadFavorites();
        this.favoriteAdded.emit();
      }
    } else {
      // Add to favorites
      await this.contentIdeaService.saveToFavorites(idea);
      await this.loadFavorites();
      this.favoriteAdded.emit();
    }
  }

  async exportAsPDF() {
    const pdf = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString();
    let y = 15;
    pdf.setFontSize(18);
    pdf.text('Generated Ideas', 10, y);
    y += 10;
    pdf.setFontSize(11);
    pdf.text(`Date: ${dateStr}`, 10, y);
    y += 10;
    this.ideas.forEach((idea, idx) => {
      if (y > 270) { pdf.addPage(); y = 15; }
      pdf.setFontSize(14);
      pdf.text(`${idx + 1}. ${idea.title}`, 10, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.text(`Type: ${idea.type}   Niche: ${idea.niche}`, 12, y);
      y += 7;
      const splitDesc = pdf.splitTextToSize(idea.description, 180);
      pdf.text(splitDesc, 14, y);
      y += splitDesc.length * 6 + 6;
    });
    pdf.save('ideas-list.pdf');
  }

  async exportToGoogleDocs() {
    try {
      const title = 'Generated Ideas';
      const today = new Date();
      const dateStr = today.toLocaleDateString();
      const content: string[] = [
        `${title}\nDate: ${dateStr}\n`,
        ...this.ideas.map((idea, idx) =>
          `${idx + 1}. ${idea.title}\nType: ${idea.type}   Niche: ${idea.niche}\n${idea.description}\n`)
      ];
      const url = await this.googleDocsService.exportToGoogleDoc(title, content);
      this.snackBar.open('Exported to Google Docs!', 'Open', { duration: 5000 })
        .onAction().subscribe(() => window.open(url, '_blank'));
    } catch (err: any) {
      this.snackBar.open('Failed to export to Google Docs: ' + (err.message || err), 'Close', { duration: 5000 });
    }
  }
}
