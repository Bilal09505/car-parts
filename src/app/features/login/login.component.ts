import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <form (ngSubmit)="onSubmit()" class="bg-white p-8 rounded-lg shadow-md w-80 space-y-4">
        <div class="login-brand"><span class="brand-mark">M<span>A</span></span>
          <h1 class="text-xl font-bold text-center">Welcome to Mughal Auto</h1>
          <p>Your parts. Your inventory. All in one place.</p>
        </div>

        <div>
          <label class="block text-sm mb-1">Email</label>
          <input id="login-email" aria-label="Email" autocomplete="username" type="email" [(ngModel)]="email" name="email" required
                 class="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label class="block text-sm mb-1">Password</label>
          <input id="login-password" aria-label="Password" autocomplete="current-password" type="password" [(ngModel)]="password" name="password" required
                 class="w-full border rounded px-3 py-2" />
        </div>

        @if (error()) {
          <p class="text-red-600 text-sm">{{ error() }}</p>
        }

        <button type="submit" [disabled]="loading()"
                class="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50">
          {{ loading() ? 'Logging in...' : 'Login' }}
        </button>
        <p class="text-xs text-gray-500 text-center">Sign-in requires an internet connection. Once signed in, downloaded data is available offline on this device.</p>
        @if (pwa.installPrompt() && !pwa.installed()) { <button type="button" class="secondary-button w-full" (click)="pwa.install()">Install Mughal Auto</button> }
        @if (pwa.ios && !pwa.installed()) { <p class="text-xs text-gray-500">Install from Safari: Share → Add to Home Screen → Add.</p> }
        @if (pwa.updateReady()) { <button type="button" class="secondary-button w-full" (click)="pwa.applyUpdate()">Update app & refresh</button> }
      </form>
    </div>
  `,
})
export class LoginComponent {
  pwa = inject(PwaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(navigator.onLine ? 'Unable to sign in. Check your email, password and connection.' : 'You are offline. Connect to the internet to sign in.');
    } finally {
      this.loading.set(false);
    }
  }
}
