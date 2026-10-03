import { Injectable } from '@angular/core';

/** Gives the existing inline modal templates consistent keyboard behavior. */
@Injectable({ providedIn: 'root' })
export class DialogAccessibilityService {
  private active?: HTMLElement;
  private previousFocus?: HTMLElement;

  constructor() {
    const update = () => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('.app-main .fixed.inset-0 > .bg-white, app-portfolio .fixed.inset-0'));
      const next = dialogs[dialogs.length - 1];
      if (next === this.active) return;
      if (!next) {
        this.active = undefined;
        if (this.previousFocus?.isConnected) this.previousFocus.focus();
        this.previousFocus = undefined;
        return;
      }
      if (!this.active) this.previousFocus = document.activeElement as HTMLElement;
      this.active = next;
      next.setAttribute('role', 'dialog');
      next.setAttribute('aria-modal', 'true');
      next.setAttribute('aria-label', next.querySelector('h2,h3')?.textContent?.trim() || 'Dialog');
      next.tabIndex = -1;
      // Focus the dialog first; do not automatically open the mobile keyboard.
      next.focus({ preventScroll: true });
    };
    new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !this.active) return;
      const elements = Array.from(this.active.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'))
        .filter(element => element.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); this.active.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === this.active)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === this.active)) { event.preventDefault(); first.focus(); }
    });
  }
}
