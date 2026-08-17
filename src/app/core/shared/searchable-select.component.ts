import {
  Component,
  Input,
  ElementRef,
  HostListener,
  ViewChild,
  forwardRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface SelectableOption {
  id?: string;
  name: string;
  vehicleModel?:string
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full" #wrapper>
      <input
        type="text"
        [class]="inputClass"
        [placeholder]="selectedLabel() ?? placeholder"
        [ngModel]="searchTerm()"
        (ngModelChange)="onSearchChange($event)"
        [disabled]="disabled"
        (focus)="open()"
      />

      @if (dropdownOpen()) {
        <ul
          class="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded border border-gray-200 bg-white shadow text-sm"
        >
          @for (o of filteredOptions(); track o.id) {
            <li
              class="px-3 py-2 cursor-pointer hover:bg-gray-100"
              [class.bg-gray-100]="o.id === value()"
              (click)="pick(o)"
            >
             {{ o.name }}{{ o.vehicleModel ? ' - ' + o.vehicleModel : '' }}
            </li>
          } @empty {
            <li class="px-3 py-2 text-gray-400">No matches</li>
          }
        </ul>
      }
    </div>
  `,
})
export class SearchableSelectComponent implements ControlValueAccessor {
  // Internally backed by a signal so `computed()` below actually re-runs
  // when options change (a plain @Input field would not trigger recompute).
  private _options = signal<SelectableOption[]>([]);
  @Input() set options(val: SelectableOption[]) {
    this._options.set(val ?? []);
  }
  get options(): SelectableOption[] {
    return this._options();
  }

  @Input() placeholder = 'Select…';
  @Input() inputClass = 'border rounded px-3 py-2 text-sm w-full';

  @ViewChild('wrapper') wrapper!: ElementRef<HTMLElement>;

  value = signal<string | null>(null);
  searchTerm = signal('');
  dropdownOpen = signal(false);
  disabled = false;

  private onChange: (val: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  selectedLabel = computed(
    () => this._options().find((o) => o.id === this.value())?.name ?? null,
  );

  // Options without an id (e.g. an unsaved doc) are excluded — they can't be
  // meaningfully selected since there's nothing to bind supplierId/etc to.
  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const withId = this._options().filter((o) => !!o.id);
    if (!term) return withId;
    return withId.filter((o) => o.name.toLowerCase().includes(term));
  });

  onSearchChange(val: string) {
    this.searchTerm.set(val);
    this.dropdownOpen.set(true);
  }

  open() {
    if (this.disabled) return;
    this.dropdownOpen.set(true);
  }

  pick(o: SelectableOption) {
    if (!o.id) return;
    this.value.set(o.id);
    this.searchTerm.set('');
    this.dropdownOpen.set(false);
    this.onChange(o.id);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (this.wrapper && !this.wrapper.nativeElement.contains(event.target as Node)) {
      this.dropdownOpen.set(false);
      this.onTouched();
    }
  }

  // --- ControlValueAccessor ---
  writeValue(val: string | null): void {
    this.value.set(val ?? null);
    this.searchTerm.set('');
  }

  registerOnChange(fn: (val: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}