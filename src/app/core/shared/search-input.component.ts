import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="relative w-full md:w-72">
      <svg
        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
        />
      </svg>
      <input
        type="text"
        [ngModel]="value()"
        (ngModelChange)="onInput($event)"
        [placeholder]="placeholder()"
        class="w-full border rounded pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
      />
      @if (value()) {
        <button
          type="button"
          (click)="onInput('')"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      }
    </div>
  `,
})
export class SearchInputComponent {
  placeholder = input<string>('Search...');
  value = model<string>('');

  onInput(val: string) {
    this.value.set(val);
  }
}