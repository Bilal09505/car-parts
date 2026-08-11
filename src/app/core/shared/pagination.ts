import {
  Component,
  input,
  output,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between gap-4 mt-4">

        <!-- Showing -->
        <div class="text-xs text-gray-500">
          Showing
          <span class="font-medium text-gray-700">
            {{ rangeStart() }}
          </span>
          -
          <span class="font-medium text-gray-700">
            {{ rangeEnd() }}
          </span>
          of
          <span class="font-medium text-gray-700">
            {{ totalItems() }}
          </span>
        </div>

        <!-- Pagination -->
        <div class="flex items-center gap-1">

          <!-- Previous -->
          <button
            type="button"
            (click)="goTo(currentPage() - 1)"
            [disabled]="currentPage() === 1"
            class="h-8 min-w-8 px-2 rounded-md border border-gray-200
                   bg-white text-gray-600 text-sm
                   hover:bg-gray-50
                   disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>

          <!-- Pages -->
          @for (p of pageNumbers(); track $index) {

            @if (p === -1) {

              <span
                class="h-8 w-8 flex items-center justify-center
                       text-gray-400 text-sm"
              >
                ...
              </span>

            } @else {

              <button
                type="button"
                (click)="goTo(p)"
                [class.bg-slate-900]="p === currentPage()"
                [class.text-white]="p === currentPage()"
                [class.border-slate-900]="p === currentPage()"
                class="h-8 min-w-8 px-2 rounded-md border
                       border-gray-200  text-gray-600
                       text-sm font-medium
                       hover:bg-gray-50"
              >
                {{ p }}
              </button>

            }

          }

          <!-- Next -->
          <button
            type="button"
            (click)="goTo(currentPage() + 1)"
            [disabled]="currentPage() === totalPages()"
            class="h-8 min-w-8 px-2 rounded-md border border-gray-200
                   bg-white text-gray-600 text-sm
                   hover:bg-gray-50
                   disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>

        </div>
      </div>
    }
  `,
})
export class PaginationComponent {

  totalItems = input.required<number>();
  pageSize = input<number>(10);
  currentPage = input<number>(1);

  currentPageChange = output<number>();

  totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.totalItems() / this.pageSize())
    )
  );

  rangeStart = computed(() =>
    this.totalItems() === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize() + 1
  );

  rangeEnd = computed(() =>
    Math.min(
      this.currentPage() * this.pageSize(),
      this.totalItems()
    )
  );

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    // Show all pages if small
    if (total <= 7) {
      return Array.from(
        { length: total },
        (_, i) => i + 1
      );
    }

    const pages: number[] = [];

    // Always first 3
    pages.push(1, 2, 3);

    // Middle
    if (current > 4 && current < total - 3) {
      pages.push(-1);

      pages.push(
        current - 1,
        current,
        current + 1
      );

      pages.push(-1);
    }

    // Near beginning
    else if (current <= 4) {
      pages.push(4);
      pages.push(-1);
    }

    // Near end
    else {
      pages.push(-1);
      pages.push(total - 3);
    }

    // Always last 3
    pages.push(
      total - 2,
      total - 1,
      total
    );

    return pages;
  });

  goTo(page: number) {
    const newPage = Math.max(
      1,
      Math.min(page, this.totalPages())
    );

    if (newPage !== this.currentPage()) {
      this.currentPageChange.emit(newPage);
    }
  }
}