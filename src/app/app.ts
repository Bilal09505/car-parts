import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaService } from './core/services/pwa.service';
import { DialogAccessibilityService } from './core/services/dialog-accessibility.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private dialogs = inject(DialogAccessibilityService);
  constructor() { void inject(PwaService).start(); }
}
