import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { OfflineDataService } from './offline-data.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private offline = inject(OfflineDataService);

  currentUser = signal<User | null>(null);

  constructor() {
    authState(this.auth).subscribe((user) => this.currentUser.set(user));
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await this.offline.clearForSignOut();
    await signOut(this.auth);
    location.replace('/login');
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }
}
