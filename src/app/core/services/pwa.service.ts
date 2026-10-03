import { Injectable, isDevMode, signal } from '@angular/core';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  installPrompt = signal<InstallPrompt | null>(null);
  installed = signal(matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
  ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  updateReady = signal(false);
  shellReady = signal(false);
  error = signal('');
  dirty = signal(false);
  private registration?: ServiceWorkerRegistration;
  private reloadRequested = false;

  constructor() {
    const updateViewport = () => document.documentElement.style.setProperty('--visible-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.addEventListener('mughal-account-cleared', () => this.dirty.set(false));
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.installPrompt.set(event as InstallPrompt);
    });
    window.addEventListener('appinstalled', () => { this.installed.set(true); this.installPrompt.set(null); });
    document.addEventListener('input', event => this.trackEdit(event), true);
    document.addEventListener('change', event => this.trackEdit(event), true);
    window.addEventListener('beforeunload', event => {
      if (this.dirty()) { event.preventDefault(); event.returnValue = ''; }
    });
  }

  private trackEdit(event: Event) {
    const element = event.target as HTMLElement;
    if (element.closest('app-login, app-search-input, app-monthly-profit-loss, .sync-panel')) return;
    if (element.matches('input, select, textarea')) this.dirty.set(true);
  }

  async start() {
    if (isDevMode() || !('serviceWorker' in navigator)) return;
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      this.updateReady.set(!!this.registration.waiting);
      this.shellReady.set(!!this.registration.active);
      const watchInstalling = () => {
        const worker = this.registration?.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') {
            this.updateReady.set(!!navigator.serviceWorker.controller);
            this.shellReady.set(true);
          }
        });
      };
      watchInstalling();
      this.registration.addEventListener('updatefound', watchInstalling);
      void navigator.serviceWorker.ready.then(() => this.shellReady.set(true));
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.shellReady.set(true);
        if (this.reloadRequested) location.reload();
        else if (navigator.serviceWorker.controller) this.updateReady.set(!!this.registration?.waiting);
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) void this.registration?.update().catch(() => {});
      });
    } catch {
      this.error.set('Offline app download is unavailable. Use HTTPS and allow browser storage.');
    }
  }
  async install() {
    const prompt = this.installPrompt();
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    this.installPrompt.set(null);
  }
  applyUpdate() {
    if (this.dirty() && !confirm('Refresh and discard unsaved form edits? Changes already saved on this device are retained.')) return;
    this.dirty.set(false);
    this.reloadRequested = true;
    this.registration?.waiting?.postMessage({ type: 'ACTIVATE_UPDATE' });
  }
}
