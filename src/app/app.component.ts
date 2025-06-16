import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { InputFormComponent } from './components/input-form/input-form.component';
import { IdeasListComponent } from './components/ideas-list/ideas-list.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ContentIdea } from './services/content-idea.service';
import { AuthService } from './services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { EmailLoginDialogComponent } from './components/email-login-dialog/email-login-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    InputFormComponent,
    IdeasListComponent,
    FavoritesComponent,
    MatTabsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <mat-toolbar color="primary" style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 1.6rem; font-weight: 600;">Content Idea Generator</span>
      <span style="flex: 1 1 auto;"></span>
      <ng-container *ngIf="!user; else loggedIn">
        <button mat-raised-button color="accent" (click)="signInWithGoogle()" style="font-size: 0.90rem; height: 28px; min-width: 0; padding: 0 10px;">
          <mat-icon style="vertical-align: middle; margin-right: 5px; font-size: 18px;">account_circle</mat-icon>
          Sign in with Google
        </button>
        <button mat-stroked-button color="primary" (click)="openLoginDialog()" style="margin-left: 6px; font-size: 0.90rem; height: 28px; min-width: 0; padding: 0 10px;">
          <mat-icon style="vertical-align: middle; margin-right: 3px; font-size: 16px;">mail</mat-icon>
          Sign in with Email
        </button>
      </ng-container>
      <ng-template #loggedIn>
        <div style="display: flex; align-items: center; gap: 4px; font-size: 0.92rem;">
          <span style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.92rem;">{{ user.displayName }}</span>
          <button mat-stroked-button color="warn" (click)="signOut()" style="font-size: 0.90rem; padding: 1px 6px; min-width: 0; min-height: 0; height: 24px;">
            <mat-icon style="vertical-align: middle; margin-right: 2px; font-size: 14px;">logout</mat-icon>
            Logout
          </button>
        </div>
      </ng-template>
    </mat-toolbar>

    <div class="container">
      <app-input-form (ideasGenerated)="onIdeasGenerated($event)"></app-input-form>
      
      <mat-tab-group>
        <mat-tab label="Generated Ideas">
          <app-ideas-list 
            [ideas]="generatedIdeas"
            (favoriteAdded)="onFavoriteAdded()">
          </app-ideas-list>
        </mat-tab>
        <mat-tab label="Favorites">
          <app-favorites #favoritesComponent></app-favorites>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent implements OnInit {
  generatedIdeas: ContentIdea[] = [];
  @ViewChild('favoritesComponent') favoritesComponent!: FavoritesComponent;
  user: any = null;

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  async signInWithGoogle() {
    await this.authService.signInWithGoogle();
  }

  async signOut() {
    await this.authService.signOut();
  }

  onIdeasGenerated(ideas: ContentIdea[]) {
    this.generatedIdeas = ideas;
  }

  onFavoriteAdded() {
    if (this.favoritesComponent) {
      this.favoritesComponent.loadFavorites();
    }
  }

  openLoginDialog() {
    this.dialog.open(EmailLoginDialogComponent, {
      width: '350px',
      disableClose: false
    });
  }
}
