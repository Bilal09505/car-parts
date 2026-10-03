import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe, KeyValuePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/services/auth.service';
import { OfflineDataService } from '../core/services/offline-data.service';
import { PwaService } from '../core/services/pwa.service';
import { IconComponent } from '../core/shared/icon.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, DatePipe, JsonPipe, KeyValuePipe, IconComponent],
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="app-layout" [class.sidebar-collapsed]="collapsed()">
      @if (drawer()) { <button class="drawer-backdrop" aria-label="Close navigation" (click)="closeDrawer()"></button> }
      <aside id="app-navigation" class="app-sidebar" [class.drawer-open]="drawer()" [attr.inert]="mobile() && !drawer() ? '' : null">
        <a class="brand" routerLink="/dashboard" (click)="closeDrawer()" aria-label="Mughal Auto dashboard">
          <span class="brand-mark">M<span> A</span></span>
          <span class="brand-copy"><strong>MUGHAL AUTO</strong><small>PARTS & INVENTORY</small></span>
        </a>
        <div class="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="nav-active" [title]="item.label"
              [attr.aria-label]="item.label" ariaCurrentWhenActive="page" (click)="closeDrawer()" class="nav-link">
              <app-icon [name]="item.icon" /><span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-footer">
          <div class="workspace-note"><span class="status-dot"></span> One workspace. Every part.</div>
          <button class="nav-link" (click)="onLogout()" [disabled]="loggingOut()" title="Sign out">
            <app-icon name="logout" /><span class="nav-label">{{ loggingOut() ? 'Signing out…' : 'Sign out' }}</span>
          </button>
        </div>
      </aside>
      <div class="app-workspace" [attr.inert]="drawer() ? '' : null">
        <header class="app-header">
          <button class="icon-button menu-toggle" (click)="toggleNavigation()" [attr.aria-expanded]="mobile() ? drawer() : !collapsed()" aria-controls="app-navigation" aria-label="Toggle navigation">
            <app-icon name="menu" />
          </button>
          <div class="header-title"><small>MUGHAL AUTO</small><strong>{{ pageTitle() }}</strong></div>
          <div class="header-actions">
            <span class="status-badge" [class.is-offline]="!data.online()" role="status"><span class="status-dot"></span>{{ data.online() ? 'Online' : 'Offline' }}</span>
            <button class="sync-button" (click)="syncPanel.set(!syncPanel())" [attr.aria-expanded]="syncPanel()">
              <app-icon name="sync" /><span>{{ data.failed() ? data.failed() + ' failed' : data.pending() ? data.pending() + ' pending' : data.syncing() ? 'Syncing' : 'Sync' }}</span>
            </button>
            @if (pwa.installPrompt() && !pwa.installed()) { <button class="primary-button install-button" (click)="pwa.install()">Install app</button> }
          </div>
        </header>
        <main id="main-content" tabindex="-1" class="app-main">
          @if (data.online() && data.downloading().length) { <div class="notice" role="status">Downloading {{ data.downloading().join(', ') }} for this device…</div> }
          @if (!data.online()) {
            <div class="notice notice-warning" role="status"><app-icon name="offline" /><div><strong>You’re working offline</strong><p>Showing data downloaded for this account. New saves stay on this device until synchronization succeeds.</p></div></div>
          }
          @if (data.message()) {
            <div class="notice" role="status"><app-icon name="sync" /><p>{{ data.message() }}</p><button class="icon-button" aria-label="Dismiss message" (click)="data.message.set('')"><app-icon name="close" /></button></div>
          }
          @if (data.operations().length) { <div class="notice notice-warning">{{ data.pending() }} pending and {{ data.failed() }} failed changes. Figures may include saves made on this device. Open Sync for details.</div> }
          @for (notice of data.notices() | keyvalue; track notice.key) {
            <div class="notice notice-warning" role="status">{{ notice.value }}</div>
          }
          @if (pwa.error()) { <div class="notice notice-warning">{{ pwa.error() }}</div> }
          @if (pwa.updateReady()) {
            <div class="notice update-notice" role="status"><div><strong>An app update is ready</strong><p>{{ data.operations().length ? 'Resolve or sync saved changes before updating.' : 'Your saved data is retained. Review unsaved edits before refreshing.' }}</p></div>
              <button class="primary-button" [disabled]="data.operations().length > 0 || data.syncing()" (click)="pwa.applyUpdate()">Update & refresh</button>
            </div>
          }
          @if (syncPanel()) {
            <section class="sync-panel surface" aria-label="Synchronization details">
              <div class="section-heading"><div><span class="eyebrow">DEVICE & CONNECTION</span><h2>Sync center</h2></div><button class="icon-button" (click)="syncPanel.set(false)" aria-label="Close sync center"><app-icon name="close" /></button></div>
              <p>Saved on this device means a durable local copy. Only “Synced to server” confirms a server save. Sync resumes automatically when this app is open and connected, or when you reopen it.</p>
              <div class="sync-summary">
                <span class="status-badge">{{ data.pending() }} pending</span><span class="status-badge" [class.is-failed]="data.failed() > 0">{{ data.failed() }} failed</span>
                <span class="status-badge">{{ pwa.shellReady() ? 'App available offline' : 'Offline app not downloaded yet' }}</span>
              </div>
              @if (data.operations().length) {
                <p class="muted">Conflicting edits never overwrite newer server data. Failed changes pause later saves. Review details before retrying or discarding.</p>
              }
              @for (operation of data.operations(); track operation.id) {
                <article class="sync-item">
                  <div class="section-heading"><strong>{{ operation.label }}</strong><span class="status-badge" [class.is-failed]="operation.state === 'failed'">{{ operation.state === 'failed' ? 'Failed sync' : 'Saved on this device' }}</span></div>
                  <small>{{ operation.createdAt | date:'medium' }}</small>
                  @if (operation.error) { <p class="error-text">{{ operation.error }}</p> }
                  <details><summary>Review saved details</summary><pre>{{ operation.writes | json }}</pre></details>
                  @if (operation.state === 'failed') {
                    <div class="card-actions"><button class="primary-button" [disabled]="!data.online() || data.syncing()" (click)="retry(operation.id)">Retry safely</button><button class="secondary-button" [disabled]="data.syncing()" (click)="discard(operation.id)">Discard change</button></div>
                  }
                </article>
              } @empty {
                <div class="empty-state"><app-icon name="check" /><strong>No changes waiting to sync</strong><p>Saved changes will appear here until the server accepts them.</p></div>
              }
              <button class="secondary-button" [disabled]="!data.online() || data.syncing()" (click)="data.refreshConnection()">Sync now</button>
              <details><summary>Downloaded data</summary>
                @for (download of data.downloads(); track download.collection) { <p>{{ download.collection }} · {{ download.downloadedAt | date:'medium' }}</p> }
                @empty { <p>No complete collections have been downloaded yet.</p> }
              </details>
              @if (pwa.installPrompt() && !pwa.installed()) { <button class="primary-button" (click)="pwa.install()">Install app</button> }
              @if (pwa.ios && !pwa.installed()) {
                <div class="install-guide"><strong>Install on iPhone or iPad</strong><p>Open this app in Safari, tap Share, then Add to Home Screen and Add.</p></div>
              }
              @if (!pwa.installed() && !pwa.installPrompt() && !pwa.ios) { <p class="muted">If supported, use your browser’s “Install app” or “Add to Home Screen” menu.</p> }
              <p class="muted">Signing out removes this account’s downloaded data and unsynced changes from this device. External gallery images, maps and videos require a connection.</p>
            </section>
          }
          <router-outlet />
        </main>
        <footer class="workspace-footer"><span>Mughal Auto · Inventory workspace</span><span>Built for the workday</span></footer>
      </div>
    </div>
  `,
})
export class ShellComponent {
  data = inject(OfflineDataService);
  pwa = inject(PwaService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  collapsed = signal(localStorage.getItem('mughal-sidebar') === 'collapsed');
  drawer = signal(false);
  mobile = signal(matchMedia('(max-width: 767px)').matches);
  syncPanel = signal(false);
  loggingOut = signal(false);
  pageTitle = signal('Workspace');
  navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Products', icon: 'box', path: '/products' },
    { label: 'Purchases', icon: 'purchase', path: '/purchase' },
    { label: 'Sales', icon: 'sales', path: '/sales' },
    { label: 'Stock lots', icon: 'layers', path: '/lots' },
    { label: 'Suppliers', icon: 'truck', path: '/suppliers' },
    { label: 'Customers', icon: 'users', path: '/customers' },
    { label: 'Reports', icon: 'chart', path: '/reports' },
    { label: 'Gallery', icon: 'image', path: '/gallery' },
  ];
  constructor() {
    const updateTitle = () => this.pageTitle.set(this.navItems.find(item => this.router.url.startsWith(item.path))?.label ?? 'Workspace');
    updateTitle();
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationEnd) { this.closeDrawer(); updateTitle(); }
    });
    const query = matchMedia('(max-width: 767px)');
    const onResize = () => { this.mobile.set(query.matches); if (!query.matches) this.closeDrawer(); };
    query.addEventListener('change', onResize);
    const onKey = (event: KeyboardEvent) => {
      if (!this.drawer()) return;
      if (event.key === 'Escape') this.closeDrawer();
      if (event.key === 'Tab') {
        const links = Array.from(document.querySelectorAll<HTMLElement>('.app-sidebar a, .app-sidebar button'));
        const first = links[0], last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    this.destroyRef.onDestroy(() => { query.removeEventListener('change', onResize); document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; });
  }
  toggleNavigation() {
    if (this.mobile()) {
      this.drawer.set(!this.drawer());
      document.body.style.overflow = this.drawer() ? 'hidden' : '';
      if (this.drawer()) setTimeout(() => document.querySelector<HTMLElement>('.app-sidebar a')?.focus());
    } else {
      this.collapsed.update(value => !value);
      localStorage.setItem('mughal-sidebar', this.collapsed() ? 'collapsed' : 'expanded');
    }
  }
  closeDrawer() {
    const wasOpen = this.drawer();
    this.drawer.set(false);
    document.body.style.overflow = '';
    if (wasOpen) setTimeout(() => document.querySelector<HTMLElement>('.menu-toggle')?.focus());
  }
  async retry(id: string) { try { await this.data.retry(id); } catch (error: any) { this.data.message.set(error.message); } }
  async discard(id: string) {
    if (!confirm('Discard this saved change? Dependent changes may need to be recreated.')) return;
    try { await this.data.discard(id); } catch (error: any) { this.data.message.set(error.message); }
  }
  async onLogout() {
    if ((this.data.operations().length || this.pwa.dirty()) && !confirm('Sign out and remove this account’s downloaded data, unsynced changes and unsaved edits from this device?')) return;
    this.loggingOut.set(true);
    try { this.pwa.dirty.set(false); await this.auth.logout(); }
    catch (error: any) { this.data.message.set('Sign-out cleanup failed. ' + error.message); this.loggingOut.set(false); }
  }
}
