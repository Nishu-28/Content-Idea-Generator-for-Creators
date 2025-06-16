import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-login-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div style="padding: 24px 20px 18px 20px; background: #18171b; border-radius: 16px; box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18); min-width: 280px; max-width: 350px;">
      <h2 mat-dialog-title style="margin-bottom: 16px; font-size: 1.25rem; font-weight: 600; text-align: center; color: #fff;">{{ isRegister ? 'Register' : 'Sign in' }} with Email</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" style="display: flex; flex-direction: column; gap: 14px;">
        <mat-form-field appearance="outline" color="primary" style="background: #232025; border-radius: 8px;">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" required autocomplete="email">
        </mat-form-field>
        <mat-form-field appearance="outline" color="primary" style="background: #232025; border-radius: 8px;">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password" required autocomplete="current-password">
        </mat-form-field>
        <div *ngIf="error" style="color: #ff6b6b; font-size: 0.97em; text-align: center;">{{ error }}</div>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading" style="height: 36px; font-size: 1rem;">
          {{ isRegister ? 'Register' : 'Sign in' }}
        </button>
        <button mat-button type="button" (click)="toggleMode()" style="margin-top: 0; color: #b39ddb; font-size: 0.97em;">
          {{ isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register" }}
        </button>
      </form>
    </div>
  `
})
export class EmailLoginDialogComponent {
  form: FormGroup;
  isRegister = false;
  error = '';
  loading = false;

  constructor(
    private dialogRef: MatDialogRef<EmailLoginDialogComponent>,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.error = '';
    this.loading = true;
    const { email, password } = this.form.value;
    try {
      if (this.isRegister) {
        await this.authService.signUpWithEmail(email, password);
      } else {
        await this.authService.signInWithEmail(email, password);
      }
      this.dialogRef.close();
    } catch (err: any) {
      this.error = err.message || 'Authentication failed.';
    } finally {
      this.loading = false;
    }
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
  }
} 