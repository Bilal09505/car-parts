import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <form (ngSubmit)="onSubmit()" class="bg-white p-8 rounded-lg shadow-md w-80 space-y-4">
        <h1 class="text-xl font-bold text-center">Mughal Auto Body Parts</h1>

        <div>
          <label class="block text-sm mb-1">Email</label>
          <input type="email" [(ngModel)]="email" name="email" required
                 class="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label class="block text-sm mb-1">Password</label>
          <input type="password" [(ngModel)]="password" name="password" required
                 class="w-full border rounded px-3 py-2" />
        </div>

        @if (error()) {
          <p class="text-red-600 text-sm">{{ error() }}</p>
        }

        <button type="submit" [disabled]="loading()"
                class="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50">
          {{ loading() ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginComponent {
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
      this.error.set('Invalid email or password.');
    } finally {
      this.loading.set(false);
    }
  }
}