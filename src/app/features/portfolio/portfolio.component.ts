import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { TypeService } from '../../core/services/type.service';
import { ModelService } from '../../core/services/model.service';
import { VehicleService } from '../../core/services/vehicle-type.service';

import { CarModel, Category, GalleryImage, Product, ProductType, VehicleModel } from '../../core/models';
import { GalleryService } from '../../core/services/gallery.service';

interface PortfolioProduct {
  id: string;
  name: string;
  category: string;
  model: string;
  type: string;
  vehicleModel: string;
  vehicle: string;
  unit: 'pcs' | 'set';
  currentSalePrice: number;
  isFeatured: boolean;
  imageUrl: string;
  stock: number;
}

interface CategoryShowcaseItem {
  name: string;
  description: string;
  image: string;
  keyword: string;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <!-- ========================================================= -->
    <!-- PAGE -->
    <!-- ========================================================= -->
    <div class="min-h-screen bg-[#f7f7f5] text-[#17191c]">
      <!-- ========================================================= -->
      <!-- TOP BAR -->
      <!-- ========================================================= -->
      <div class="hidden sm:block bg-[#0d0f10] text-white">
        <div class="max-w-7xl mx-auto px-5 lg:px-8 h-10 flex items-center justify-between text-xs">
          <div class="flex items-center gap-6 text-white/65">
            <span class="flex items-center gap-2">
              <span class="text-[#f2b705]">●</span>
              Gujrat, Punjab
            </span>

            <span class="hidden md:block"> Opposite  Daewoo Bus Stand Gujrat </span>
          </div>

          <div class="flex items-center gap-5">
            <a
              href="mailto:mughalautos278@gmail.com"
              class="hover:text-[#f2b705] transition-colors"
            >
              mughalautos278&#64;gmail.com
            </a>

            <a href="tel:03336724500" class="font-semibold text-[#f2b705]"> 0333 6724500 </a>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- NAVBAR -->
      <!-- ========================================================= -->
      <nav class="sticky top-0 z-50 bg-[#111315]/95 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between">
          <!-- BRAND -->
          <a href="#home" class="flex items-center gap-3 group">
            <div
              class="w-10 h-10 bg-[#f2b705] rounded-xl flex items-center justify-center text-[#111315] font-black text-lg shadow-lg shadow-yellow-500/10"
            >
              M
            </div>

            <div>
              <div class="text-white font-black tracking-tight text-lg leading-none">
                MUGHAL AUTO
              </div>

              <div class="text-[#f2b705] text-[10px] tracking-[0.2em] font-bold mt-1">
                BODY PARTS
              </div>
            </div>
          </a>

          <!-- DESKTOP NAV -->
          <div class="hidden lg:flex items-center gap-8">
            <a href="#home" class="text-sm text-white/70 hover:text-white transition-colors">
              Home
            </a>

            <a href="#categories" class="text-sm text-white/70 hover:text-white transition-colors">
              Categories
            </a>

            <a href="#products" class="text-sm text-white/70 hover:text-white transition-colors">
              Products
            </a>

            <a href="#contact" class="text-sm text-white/70 hover:text-white transition-colors">
              Contact
            </a>
          </div>

          <!-- CALL CTA -->
          <a
            href="tel:03336724500"
            class="flex items-center gap-2 bg-[#f2b705] hover:bg-[#ffc72c] text-[#111315] px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
          >
            <span>☎</span>
            <span class="hidden sm:inline">Call Now</span>
          </a>
        </div>
      </nav>

      <!-- ========================================================= -->
      <!-- HERO -->
      <!-- ========================================================= -->
      <section id="home" class="relative overflow-hidden bg-[#111315] text-white">
        <!-- Background -->
        <div class="absolute inset-0">
          <img
            src="https://placehold.co/1800x900/17191c/303338?text=Mughal+Auto+Body+Parts"
            alt=""
            class="w-full h-full object-cover opacity-25"
          />

          <div
            class="absolute inset-0 bg-gradient-to-r from-[#111315] via-[#111315]/95 to-[#111315]/60"
          ></div>
        </div>

        <!-- Decorative -->
        <div
          class="absolute -right-40 -top-40 w-[500px] h-[500px] rounded-full border border-[#f2b705]/10"
        ></div>

        <div
          class="absolute -right-20 -top-20 w-[350px] h-[350px] rounded-full border border-[#f2b705]/10"
        ></div>

        <div class="relative max-w-7xl mx-auto px-5 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div class="max-w-3xl">
            <!-- Eyebrow -->
            <div
              class="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-7"
            >
              <span class="w-2 h-2 rounded-full bg-[#f2b705]"></span>

              <span class="text-xs sm:text-sm font-semibold text-white/75">
                AUTO BODY PARTS • GUJRAT, PUNJAB
              </span>
            </div>

            <!-- Heading -->
            <h1
              class="font-black tracking-[-0.04em] leading-[0.95] text-5xl sm:text-6xl lg:text-8xl"
            >
              The right part.
              <span class="text-[#f2b705]"> The right fit. </span>
            </h1>

            <p class="mt-7 max-w-2xl text-base sm:text-lg lg:text-xl text-white/65 leading-relaxed">
              Quality auto body parts for a wide range of vehicles. Find bumpers, lights, mirrors,
              panels and more — without the guesswork.
            </p>

            <!-- CTA -->
            <div class="flex flex-col sm:flex-row gap-3 mt-9">
              <a
                href="#products"
                class="inline-flex items-center justify-center gap-2 bg-[#f2b705] hover:bg-[#ffc72c] text-[#111315] px-6 py-3.5 rounded-xl font-black transition-all hover:-translate-y-0.5"
              >
                Browse Parts
                <span>→</span>
              </a>

              <a
                href="https://wa.me/923336724500?text=Hello%20Mughal%20Auto%20Body%20Parts%2C%20I%20need%20information%20about%20an%20auto%20part."
                target="_blank"
                rel="noopener"
                class="inline-flex items-center justify-center gap-2 border border-white/15 hover:border-[#f2b705] bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 rounded-xl font-bold transition-all"
              >
                WhatsApp Us
                <span>↗</span>
              </a>
            </div>

            <!-- Trust -->
            <div class="mt-12 pt-7 border-t border-white/10 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <div class="text-[#f2b705] font-black text-xl">Quality</div>
                <div class="text-white/45 text-xs mt-1">Parts you can trust</div>
              </div>

              <div>
                <div class="text-[#f2b705] font-black text-xl">Wide Range</div>
                <div class="text-white/45 text-xs mt-1">Multiple makes & models</div>
              </div>

              <div>
                <div class="text-[#f2b705] font-black text-xl">Local</div>
                <div class="text-white/45 text-xs mt-1">Based in Gujrat</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
<!-- GALLERY -->
<!-- ========================================================= -->
@if (galleryImages().length > 0) {
  <section class="bg-white border-b border-black/5">
    <div class="max-w-7xl mx-auto px-5 lg:px-8 py-14 sm:py-20">
      <div class="mb-8">
        <span class="text-[#a97907] text-xs font-black tracking-[0.18em]">OUR SHOP</span>
        <h2 class="text-3xl sm:text-4xl font-black tracking-tight mt-2">Gallery</h2>
        <p class="text-[#70757b] mt-2 max-w-xl">A look at our shop, stock and work.</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (img of galleryImages(); track img.id) {
          <button
            type="button"
            (click)="openLightbox(img)"
            class="group relative aspect-square bg-[#ecece8] rounded-2xl overflow-hidden border border-black/5 hover:border-[#f2b705]/60 transition-all"
          >
            <img
              [src]="img.imageUrl"
              [alt]="img.caption || 'Gallery image'"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            @if (img.caption) {
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p class="text-white text-xs font-bold text-left line-clamp-1">{{ img.caption }}</p>
              </div>
            }
          </button>
        }
      </div>
    </div>
  </section>
}

<!-- LIGHTBOX MODAL -->
@if (lightboxImage(); as img) {
  <div
    class="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4"
    (click)="closeLightbox()"
  >
    <button
      type="button"
      (click)="closeLightbox()"
      class="absolute top-5 right-5 text-white text-3xl leading-none"
    >
      ✕
    </button>
    <div class="max-w-4xl w-full" (click)="$event.stopPropagation()">
      <img [src]="img.imageUrl" [alt]="img.caption || 'Gallery image'" class="w-full max-h-[80vh] object-contain rounded-xl" />
      @if (img.caption) {
        <p class="text-white text-center mt-3 text-sm font-bold">{{ img.caption }}</p>
      }
    </div>
  </div>
}

      <!-- ========================================================= -->
      <!-- QUICK SEARCH -->
      <!-- ========================================================= -->
      <section class="relative z-10 -mt-7">
        <div class="max-w-6xl mx-auto px-5 lg:px-8">
          <div
            class="bg-white rounded-2xl shadow-xl shadow-black/5 border border-black/5 p-4 sm:p-5"
          >
            <div class="flex flex-col lg:flex-row gap-4">
              <!-- Search -->
              <div class="flex-1 relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#92979d]"> ⌕ </span>

                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  placeholder="Search for a part, e.g. bumper, mirror, headlight..."
                  class="w-full h-12 bg-[#f5f5f3] border border-[#e5e5e1] rounded-xl pl-11 pr-4 text-sm outline-none focus:border-[#f2b705] focus:ring-2 focus:ring-[#f2b705]/10 transition-all"
                />
              </div>

              <!-- Category -->
              <select
                [(ngModel)]="selectedCategory"
                class="lg:w-48 h-12 bg-[#f5f5f3] border border-[#e5e5e1] rounded-xl px-4 text-sm outline-none focus:border-[#f2b705]"
              >
                <option value="">All Categories</option>

                @for (category of categoryOptions(); track category) {
                  <option [value]="category">
                    {{ category }}
                  </option>
                }
              </select>

              <!-- Vehicle -->
              <select
                [(ngModel)]="selectedVehicle"
                class="lg:w-48 h-12 bg-[#f5f5f3] border border-[#e5e5e1] rounded-xl px-4 text-sm outline-none focus:border-[#f2b705]"
              >
                <option value="">All Vehicles</option>

                @for (vehicle of vehicleOptions(); track vehicle) {
                  <option [value]="vehicle">
                    {{ vehicle }}
                  </option>
                }
              </select>
            </div>

            @if (hasActiveFilter()) {
              <div class="mt-4 flex items-center justify-between">
                <p class="text-xs text-[#70757b]">
                  Showing
                  <strong class="text-[#17191c]">
                    {{ filteredProducts().length }}
                  </strong>
                  matching parts
                </p>

                <button
                  type="button"
                  (click)="clearFilters()"
                  class="text-xs font-bold text-[#a97907] hover:text-[#7e5d00]"
                >
                  Clear all filters ×
                </button>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- CATEGORIES -->
      <!-- ========================================================= -->
      <section id="categories" class="max-w-7xl mx-auto px-5 lg:px-8 pt-20 sm:pt-28 pb-12">
        <div class="flex items-end justify-between gap-5 mb-8">
          <div>
            <span class="text-[#a97907] text-xs font-black tracking-[0.18em]">
              SHOP BY CATEGORY
            </span>

            <h2 class="text-3xl sm:text-4xl font-black tracking-tight mt-2">Find what you need</h2>

            <p class="text-[#70757b] mt-2 max-w-xl">Browse our most popular auto body parts.</p>
          </div>

          <button
            type="button"
            (click)="showAllProducts()"
            class="hidden sm:block text-sm font-bold text-[#a97907] hover:text-[#765800]"
          >
            View all →
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          @for (category of categoryShowcase; track category.name) {
            <button
              type="button"
              (click)="selectCategory(category.keyword)"
              class="group text-left bg-white border border-black/5 rounded-2xl overflow-hidden hover:border-[#f2b705]/60 hover:shadow-lg hover:shadow-black/5 transition-all"
            >
              <div class="aspect-square bg-[#ecece8] overflow-hidden">
                <img
                  [src]="category.image"
                  [alt]="category.name"
                  loading="lazy"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div class="p-4">
                <h3 class="font-black text-sm">
                  {{ category.name }}
                </h3>

                <p class="text-xs text-[#858a90] mt-1 leading-relaxed">
                  {{ category.description }}
                </p>
              </div>
            </button>
          }
        </div>
      </section>

      <section id="products" class="bg-white border-y border-black/5">
        <div class="max-w-7xl mx-auto px-5 lg:px-8 py-20 sm:py-28">
          <div class="mb-9">
            <span class="text-[#a97907] text-xs font-black tracking-[0.18em]"> PART FINDER </span>

            <h2 class="text-3xl sm:text-4xl font-black tracking-tight mt-2">Find your part</h2>

            <p class="text-[#70757b] mt-2">
              Search for a part or select a category to see available products.
            </p>
          </div>

          <!-- ===================================================== -->
          <!-- NO FILTER SELECTED -->
          <!-- ===================================================== -->

          @if (!hasActiveFilter()) {
            <div
              class="rounded-3xl border border-dashed border-[#d8d8d3]
               bg-[#fafaf8] px-6 py-20 text-center"
            >
              <div
                class="mx-auto w-16 h-16 rounded-2xl
                 bg-[#fff7d6] flex items-center justify-center
                 text-3xl"
              >
                🔍
              </div>

              <h3 class="font-black text-xl mt-6">What part are you looking for?</h3>

              <p class="text-sm text-[#777d83] max-w-md mx-auto mt-2 leading-relaxed">
                Search for a part above or select a category, vehicle and model to find matching
                products.
              </p>

              <div class="flex flex-wrap justify-center gap-2 mt-6">
                <span
                  class="px-3 py-2 rounded-lg bg-white border border-black/5
                   text-xs font-bold text-[#70757b]"
                >
                  Bumpers
                </span>

                <span
                  class="px-3 py-2 rounded-lg bg-white border border-black/5
                   text-xs font-bold text-[#70757b]"
                >
                  Headlights
                </span>

                <span
                  class="px-3 py-2 rounded-lg bg-white border border-black/5
                   text-xs font-bold text-[#70757b]"
                >
                  Mirrors
                </span>

                <span
                  class="px-3 py-2 rounded-lg bg-white border border-black/5
                   text-xs font-bold text-[#70757b]"
                >
                  Grilles
                </span>
              </div>
            </div>
          }

          <!-- ===================================================== -->
          <!-- PRODUCTS -->
          <!-- ===================================================== -->

          @if (hasActiveFilter() && displayProducts().length > 0) {
            <div class="flex items-center justify-between mb-5">
              <p class="text-sm text-[#70757b]">
                <strong class="text-[#17191c]">
                  {{ displayProducts().length }}
                </strong>

                {{ displayProducts().length === 1 ? 'part' : 'parts' }}

                found
              </p>
            </div>

            <div
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
               gap-4 sm:gap-6"
            >
              @for (product of displayProducts(); track product.id) {
                <article
                  class="group bg-[#f8f8f6]
                   border border-black/5
                   rounded-2xl overflow-hidden
                   hover:bg-white
                   hover:border-[#f2b705]/60
                   hover:shadow-xl
                   hover:shadow-black/5
                   transition-all duration-300"
                >
                  <!-- IMAGE -->
                  <div
                    class="relative aspect-[4/3]
                     bg-[#e9e9e5] overflow-hidden"
                  >
                    <img
                      [src]="product.imageUrl"
                      [alt]="product.name"
                      loading="lazy"
                      class="w-full h-full object-cover
                       group-hover:scale-105
                       transition-transform duration-500"
                    />

                    @if (product.isFeatured) {
                      <span
                        class="absolute top-3 left-3
                         bg-[#f2b705] text-[#111315]
                         px-2.5 py-1 rounded-lg
                         text-[10px] font-black"
                      >
                        FEATURED
                      </span>
                    }

                    <span
                      class="absolute top-3 right-3
                       px-2.5 py-1 rounded-lg
                       text-[10px] font-black"
                      [class.bg-[#dcfce7]]="product.stock > 0"
                      [class.text-[#166534]]="product.stock > 0"
                      [class.bg-[#fee2e2]]="product.stock <= 0"
                      [class.text-[#991b1b]]="product.stock <= 0"
                    >
                      {{ product.stock > 0 ? product.stock + ' IN STOCK' : 'OUT OF STOCK' }}
                    </span>
                  </div>

                  <!-- CONTENT -->
                  <div class="p-4 sm:p-5">
                    <div
                      class="text-[10px]
                       font-black
                       text-[#a97907]
                       uppercase
                       tracking-wider"
                    >
                      {{ product.category || 'Auto Part' }}
                    </div>

                    <h3
                      class="font-black
                       text-sm sm:text-base
                       leading-snug
                       line-clamp-2
                       mt-1"
                    >
                      {{ product.name }}
                    </h3>

                    @if (product.vehicle || product.model) {
                      <p
                        class="text-xs
                         text-[#747a80]
                         mt-2
                         line-clamp-1"
                      >
                        {{ product.vehicle }}

                        @if (product.vehicle && product.model) {
                          <span> • </span>
                        }

                        {{ product.model }}
                      </p>
                    }

                    <div class="mt-5 flex items-end justify-between">
                      @if (product.currentSalePrice > 0) {
                        <div>
                          <div
                            class="text-lg
                             sm:text-xl
                             font-black"
                          >
                            Rs.
                            {{ formatPrice(product.currentSalePrice) }}
                          </div>

                          <div
                            class="text-[10px]
                             text-[#92979d]"
                          >
                            Per {{ product.unit }}
                          </div>
                        </div>
                      } @else {
                        <div
                          class="text-sm
                           font-bold
                           text-[#70757b]"
                        >
                          Contact for price
                        </div>
                      }
                    </div>

                    <a
                      [href]="whatsappProductUrl(product)"
                      target="_blank"
                      rel="noopener"
                      class="mt-4
                       w-full
                       h-10
                       rounded-xl
                       bg-[#17191c]
                       hover:bg-[#f2b705]
                       text-white
                       hover:text-[#111315]
                       flex
                       items-center
                       justify-center
                       gap-2
                       text-xs
                       font-black
                       transition-all"
                    >
                      Ask on WhatsApp
                      <span>↗</span>
                    </a>
                  </div>
                </article>
              }
            </div>
          }

          <!-- ===================================================== -->
          <!-- FILTER ACTIVE BUT NO RESULT -->
          <!-- ===================================================== -->

          @if (hasActiveFilter() && displayProducts().length === 0) {
            <div
              class="rounded-3xl
               border border-dashed border-[#d8d8d3]
               bg-[#fafaf8]
               px-6 py-20
               text-center"
            >
              <div
                class="mx-auto
                 w-16 h-16
                 rounded-2xl
                 bg-[#f1f1ee]
                 flex items-center justify-center
                 text-2xl"
              >
                🔎
              </div>

              <h3 class="font-black text-xl mt-6">No matching parts found</h3>

              <p
                class="text-sm text-[#777d83]
                 max-w-md mx-auto
                 mt-2
                 leading-relaxed"
              >
                We couldn't find a product matching your current search or vehicle selection. Try
                another option or contact us directly.
              </p>

              <div
                class="flex flex-col sm:flex-row
                 justify-center gap-3 mt-7"
              >
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="px-5 py-3
                   rounded-xl
                   bg-[#17191c]
                   text-white
                   text-sm
                   font-bold
                   hover:bg-black"
                >
                  Clear filters
                </button>

                <a
                  href="https://wa.me/923336724500?text=Hello%20Mughal%20Auto%20Body%20Parts%2C%20I%20am%20looking%20for%20an%20auto%20part."
                  target="_blank"
                  rel="noopener"
                  class="px-5 py-3
                   rounded-xl
                   bg-[#f2b705]
                   text-[#111315]
                   text-sm
                   font-bold
                   hover:bg-[#ffc72c]"
                >
                  Ask us on WhatsApp
                </a>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- WHY US -->
      <!-- ========================================================= -->
      <section class="max-w-7xl mx-auto px-5 lg:px-8 py-20 sm:py-28">
        <div class="max-w-2xl mb-10">
          <span class="text-[#a97907] text-xs font-black tracking-[0.18em]"> WHY MUGHAL AUTO </span>

          <h2 class="text-3xl sm:text-4xl font-black tracking-tight mt-2">
            Parts without the guesswork.
          </h2>

          <p class="text-[#70757b] mt-3 leading-relaxed">
            Tell us what vehicle you have and what part you need. We'll help you find the right
            option.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          @for (item of whyUs; track item.number) {
            <div
              class="bg-white border border-black/5 rounded-2xl p-6 hover:border-[#f2b705]/50 transition-colors"
            >
              <div
                class="w-11 h-11 rounded-xl bg-[#f2b705] flex items-center justify-center font-black text-[#111315]"
              >
                {{ item.number }}
              </div>

              <h3 class="font-black text-lg mt-6">
                {{ item.title }}
              </h3>

              <p class="text-sm text-[#747a80] leading-relaxed mt-2">
                {{ item.description }}
              </p>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- YOUTUBE -->
      <!-- ========================================================= -->
      <section class="bg-[#111315] text-white">
        <div class="max-w-7xl mx-auto px-5 lg:px-8 py-20 sm:py-28">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
            <div>
              <span class="text-[#f2b705] text-xs font-black tracking-[0.18em]">
                SHOP & UPDATES
              </span>

              <h2 class="text-3xl sm:text-4xl font-black tracking-tight mt-2">See us in action.</h2>

              <p class="text-white/50 mt-2 max-w-xl">
                Product videos, shop updates and automotive content.
              </p>
            </div>

            <a
              href="https://youtube.com/@mughalautos-01"
              target="_blank"
              rel="noopener"
              class="text-[#f2b705] text-sm font-bold"
            >
              Visit YouTube →
            </a>
          </div>

          <div class="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
            <iframe
              class="w-full h-full"
              [src]="youtubeEmbedUrl"
              title="Mughal Auto Body Parts YouTube"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- CONTACT -->
      <!-- ========================================================= -->
      <section id="contact" class="bg-white border-b border-black/5">
        <div class="max-w-7xl mx-auto px-5 lg:px-8 py-20 sm:py-28">
          <div class="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <!-- Info -->
            <div>
              <span class="text-[#a97907] text-xs font-black tracking-[0.18em]"> CONTACT US </span>

              <h2 class="text-3xl sm:text-4xl font-black tracking-tight mt-2">
                Need a part?
                <br />
                Let's find it.
              </h2>

              <p class="text-[#70757b] mt-4 max-w-lg leading-relaxed">
                Call, WhatsApp or visit our shop in Gujrat. Send us your vehicle model and the part
                you need.
              </p>

              <!-- Contact cards -->
              <div class="grid sm:grid-cols-2 gap-4 mt-8">
                <a
                  href="tel:03336724500"
                  class="group border border-black/5 rounded-2xl p-5 hover:border-[#f2b705] transition-colors"
                >
                  <div
                    class="w-10 h-10 rounded-xl bg-[#f2f2ef] flex items-center justify-center group-hover:bg-[#f2b705] transition-colors"
                  >
                    ☎
                  </div>

                  <div class="text-xs text-[#92979d] mt-4">Call us</div>

                  <div class="font-black mt-1">0333 6724500</div>
                </a>

                <a
                  href="https://wa.me/923336724500"
                  target="_blank"
                  rel="noopener"
                  class="group border border-black/5 rounded-2xl p-5 hover:border-[#f2b705] transition-colors"
                >
                  <div
                    class="w-10 h-10 rounded-xl bg-[#f2f2ef] flex items-center justify-center group-hover:bg-[#f2b705] transition-colors"
                  >
                    💬
                  </div>

                  <div class="text-xs text-[#92979d] mt-4">WhatsApp</div>

                  <div class="font-black mt-1">Message us</div>
                </a>

                <a
                  href="mailto:mughalautos278@gmail.com"
                  class="group border border-black/5 rounded-2xl p-5 hover:border-[#f2b705] transition-colors sm:col-span-2"
                >
                  <div class="text-xs text-[#92979d]">Email</div>

                  <div class="font-black mt-1 break-all">mughalautos278&#64;gmail.com</div>
                </a>
              </div>

              <!-- Social -->
              <div class="flex flex-wrap gap-3 mt-6">
                <a
                  href="https://www.facebook.com/share/1DFkzJLxEi/"
                  target="_blank"
                  rel="noopener"
                  class="px-4 py-2.5 rounded-xl bg-[#f4f4f1] hover:bg-[#f2b705] text-sm font-bold transition-colors"
                >
                  Facebook
                </a>

                <a
                  href="https://www.tiktok.com/@mughalautobodyparts"
                  target="_blank"
                  rel="noopener"
                  class="px-4 py-2.5 rounded-xl bg-[#f4f4f1] hover:bg-[#f2b705] text-sm font-bold transition-colors"
                >
                  TikTok
                </a>

                <a
                  href="https://youtube.com/@mughalautos-01"
                  target="_blank"
                  rel="noopener"
                  class="px-4 py-2.5 rounded-xl bg-[#f4f4f1] hover:bg-[#f2b705] text-sm font-bold transition-colors"
                >
                  YouTube
                </a>
              </div>
            </div>

            <!-- Map -->
            <div
              class="min-h-[420px] rounded-2xl overflow-hidden bg-[#e9e9e5] border border-black/5"
            >
              <iframe
                title="Mughal Auto Body Parts location"
                [src]="mapEmbedUrl"
                width="100%"
                height="100%"
                style="border:0; min-height:420px;"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- FOOTER -->
      <!-- ========================================================= -->
      <footer class="bg-[#0d0f10] text-white">
        <div class="max-w-7xl mx-auto px-5 lg:px-8 py-10">
          <div class="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 bg-[#f2b705] rounded-lg flex items-center justify-center text-[#111315] font-black"
                >
                  M
                </div>

                <div>
                  <div class="font-black">MUGHAL AUTO</div>

                  <div class="text-[#f2b705] text-[9px] tracking-[0.2em] font-bold">BODY PARTS</div>
                </div>
              </div>

              <p class="text-white/40 text-sm max-w-sm mt-4 leading-relaxed">
                Quality auto body parts in Gujrat, Punjab. Find the right part for your vehicle.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-x-14 gap-y-3 text-sm">
              <a href="#home" class="text-white/50 hover:text-white transition-colors"> Home </a>

              <a href="#categories" class="text-white/50 hover:text-white transition-colors">
                Categories
              </a>

              <a href="#products" class="text-white/50 hover:text-white transition-colors">
                Products
              </a>

              <a href="#contact" class="text-white/50 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>

          <div
            class="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/35"
          >
            <span> © {{ currentYear }} Mughal Auto Body Parts </span>

            <span> Near Daewoo Bus Stand, Rakh Dena, Gujrat </span>
          </div>
        </div>
      </footer>

      <!-- ========================================================= -->
      <!-- MOBILE ACTION BAR -->
      <!-- ========================================================= -->
      <div
        class="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#111315]/95 backdrop-blur-md border-t border-white/10 p-3"
      >
        <div class="grid grid-cols-2 gap-2">
          <a
            href="tel:03336724500"
            class="h-11 rounded-xl bg-[#f2b705] text-[#111315] flex items-center justify-center gap-2 font-black text-sm"
          >
            ☎ Call
          </a>

          <a
            href="https://wa.me/923336724500"
            target="_blank"
            rel="noopener"
            class="h-11 rounded-xl bg-white text-[#111315] flex items-center justify-center gap-2 font-black text-sm"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  `,
})
export class PortfolioComponent {
  private readonly sanitizer = inject(DomSanitizer);

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly modelService = inject(ModelService);
  private readonly typeService = inject(TypeService);
  private readonly vehicleService = inject(VehicleService);

  private readonly galleryService = inject(GalleryService);
  readonly galleryImages = signal<GalleryImage[]>([]);
  readonly lightboxImage = signal<GalleryImage | null>(null);

  // ============================================================
  // BASIC
  // ============================================================

  readonly currentYear = new Date().getFullYear();

  // ============================================================
  // DATA
  // ============================================================

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly models = signal<CarModel[]>([]);
  readonly types = signal<ProductType[]>([]);
  readonly vehicles = signal<VehicleModel[]>([]);

  // ============================================================
  // FILTERS
  // ============================================================

  readonly searchTerm = signal('');
  readonly selectedCategory = signal('');
  readonly selectedVehicle = signal('');
  readonly selectedModel = signal('');
  readonly selectedType = signal('');

  // ============================================================
  // MEDIA
  // ============================================================

  readonly mapEmbedUrl: SafeResourceUrl;

  readonly youtubeEmbedUrl: SafeResourceUrl;

  // ============================================================
  // CATEGORY SHOWCASE
  // ============================================================

  readonly categoryShowcase: CategoryShowcaseItem[] = [
    {
      name: 'Bumpers',
      description: 'Front & rear bumpers',
      keyword: 'bumper',
      image: 'https://placehold.co/600x600/e8e8e4/303338?text=Bumpers',
    },
    {
      name: 'Headlights',
      description: 'Headlights & lamps',
      keyword: 'headlight',
      image: 'https://placehold.co/600x600/e8e8e4/303338?text=Headlights',
    },
    {
      name: 'Mirrors',
      description: 'Side & door mirrors',
      keyword: 'mirror',
      image: 'https://placehold.co/600x600/e8e8e4/303338?text=Mirrors',
    },
    {
      name: 'Grilles',
      description: 'Front grilles',
      keyword: 'grille',
      image: 'https://placehold.co/600x600/e8e8e4/303338?text=Grilles',
    },
    {
      name: 'Tail Lights',
      description: 'Rear lighting',
      keyword: 'tail light',
      image: 'https://placehold.co/600x600/e8e8e4/303338?text=Tail+Lights',
    },
    {
      name: 'Panels',
      description: 'Body panels & fenders',
      keyword: 'panel',
      image: 'https://placehold.co/600x600/e8e8e4/303338?text=Panels',
    },
  ];

  // ============================================================
  // WHY US
  // ============================================================

  readonly whyUs = [
    {
      number: '01',
      title: 'Quality Parts',
      description: 'We focus on reliable body parts that are fit for the job.',
    },
    {
      number: '02',
      title: 'Wide Selection',
      description: 'Parts for multiple vehicle makes, models and body styles.',
    },
    {
      number: '03',
      title: 'Local Expertise',
      description: 'Based in Gujrat with practical knowledge of the local market.',
    },
    {
      number: '04',
      title: 'Easy Ordering',
      description: 'Call or WhatsApp us with your vehicle details and part requirement.',
    },
  ];

  // ============================================================
  // CONVERT PRODUCTS
  // ============================================================

  readonly portfolioProducts = computed<PortfolioProduct[]>(() => {
    return this.products().map((product: any, index) => {
      const category = this.resolveName(
        product.category ?? product.categoryName ?? product.categoryId,
        this.categories(),
      );

      const model = this.resolveName(
        product.model ?? product.modelName ?? product.modelId,
        this.models(),
      );

      const type = this.resolveName(
        product.type ?? product.typeName ?? product.typeId,
        this.types(),
      );

      const vehicle = this.resolveName(
        product.vehicle ?? product.vehicleName ?? product.vehicleId ?? product.vehicleTypeId,
        this.vehicles(),
      );

      return {
        id: String(product.id ?? product.productId ?? index),

        name: product.name ?? product.productName ?? 'Auto Body Part',

        category,

        model,

        type,

        vehicleModel: product.vehicleModel ?? product.vehicleModelName ?? '',

        vehicle,

        unit: product.unit === 'set' ? 'set' : 'pcs',

        currentSalePrice: Number(
          product.currentSalePrice ?? product.salePrice ?? product.price ?? 0,
        ),

        isFeatured: Boolean(product.isFeatured ?? product.featured ?? false),

        imageUrl:
          product.imageUrl ??
          product.image ??
          product.productImage ??
          this.placeholderImage(product.name ?? product.productName ?? 'Auto Part'),

        stock: Number(product.stock ?? product.quantityRemaining ?? product.availableStock ?? 0),
      };
    });
  });

  // ============================================================
  // FILTER OPTIONS
  // ============================================================

  readonly categoryOptions = computed(() => {
    const values = this.portfolioProducts()
      .map((p) => p.category)
      .filter(Boolean);

    return this.uniqueSorted(values);
  });

  readonly vehicleOptions = computed(() => {
    const values = this.portfolioProducts()
      .map((p) => p.vehicle)
      .filter(Boolean);

    return this.uniqueSorted(values);
  });

  readonly modelOptions = computed(() => {
    const products = this.portfolioProducts();

    const vehicle = this.normalize(this.selectedVehicle());

    const values = products
      .filter((p) => {
        if (!vehicle) {
          return true;
        }

        return this.normalize(p.vehicle) === vehicle;
      })
      .map((p) => p.model)
      .filter(Boolean);

    return this.uniqueSorted(values);
  });

  readonly typeOptions = computed(() => {
    const values = this.portfolioProducts()
      .map((p) => p.type)
      .filter(Boolean);

    return this.uniqueSorted(values);
  });

  // ============================================================
  // FILTERED PRODUCTS
  // ============================================================

  readonly filteredProducts = computed(() => {
    const products = this.portfolioProducts();

    const search = this.normalize(this.searchTerm());

    const category = this.normalize(this.selectedCategory());

    const vehicle = this.normalize(this.selectedVehicle());

    const model = this.normalize(this.selectedModel());

    const type = this.normalize(this.selectedType());

    return products.filter((product) => {
      const searchableText = this.normalize(
        [
          product.name,
          product.category,
          product.model,
          product.vehicle,
          product.vehicleModel,
          product.type,
        ].join(' '),
      );

      if (search && !searchableText.includes(search)) {
        return false;
      }

      if (category && this.normalize(product.category) !== category) {
        return false;
      }

      if (vehicle && this.normalize(product.vehicle) !== vehicle) {
        return false;
      }

      if (model && this.normalize(product.model) !== model) {
        return false;
      }

      if (type && this.normalize(product.type) !== type) {
        return false;
      }

      return true;
    });
  });

  // ============================================================
  // DISPLAY PRODUCTS
  // ============================================================

  readonly displayProducts = computed(() => {
    // IMPORTANT:
    // Do not show products on initial page load.
    if (!this.hasActiveFilter()) {
      return [];
    }

    return this.filteredProducts();
  });

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor() {
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps?q=Mughal+Auto+Body+Parts+Rakh+Dena+near+Daewoo+Bus+Stand+Gujrat&output=embed',
    );

    this.youtubeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/videoseries?list=UUhbF93VKDUTiWneUmVpM5WA',
    );

    this.loadData();
  }

  // ============================================================
  // LOAD DATA
  // ============================================================

  private loadData(): void {
    this.productService.list().subscribe({
      next: (items) => {
        this.products.set(items ?? []);
      },
      error: (error) => {
        console.error('Failed to load products:', error);

        this.products.set([]);
      },
    });

    this.categoryService.list().subscribe({
      next: (items) => {
        this.categories.set(items ?? []);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);

        this.categories.set([]);
      },
    });

    this.modelService.list().subscribe({
      next: (items) => {
        this.models.set(items ?? []);
      },
      error: (error) => {
        console.error('Failed to load models:', error);

        this.models.set([]);
      },
    });

    this.typeService.list().subscribe({
      next: (items) => {
        this.types.set(items ?? []);
      },
      error: (error) => {
        console.error('Failed to load product types:', error);

        this.types.set([]);
      },
    });

    this.vehicleService.list().subscribe({
      next: (items) => {
        this.vehicles.set(items ?? []);
      },
      error: (error) => {
        console.error('Failed to load vehicles:', error);

        this.vehicles.set([]);
      },
    });

    this.galleryService.list().subscribe({
  next: (items) => this.galleryImages.set(items ?? []),
  error: (error) => {
    console.error('Failed to load gallery:', error);
    this.galleryImages.set([]);
  },
});
  }

  openLightbox(img: GalleryImage): void {
  this.lightboxImage.set(img);
}

closeLightbox(): void {
  this.lightboxImage.set(null);
}

  // ============================================================
  // FILTER STATE
  // ============================================================

  hasActiveFilter(): boolean {
    return Boolean(
      this.searchTerm().trim() ||
      this.selectedCategory() ||
      this.selectedVehicle() ||
      this.selectedModel() ||
      this.selectedType(),
    );
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.selectedVehicle.set('');
    this.selectedModel.set('');
    this.selectedType.set('');
  }

  // ============================================================
  // CATEGORY SELECTION
  // ============================================================

  selectCategory(category: string): void {
    this.selectedCategory.set(category);

    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  showAllProducts(): void {
    this.clearFilters();

    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // ============================================================
  // PRICE
  // ============================================================

  formatPrice(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  // ============================================================
  // WHATSAPP
  // ============================================================

  whatsappProductUrl(product: PortfolioProduct): string {
    const message = [
      'Hello Mughal Auto Body Parts,',
      '',
      `I am interested in: ${product.name}`,
      product.vehicle ? `Vehicle: ${product.vehicle}` : '',
      product.model ? `Model: ${product.model}` : '',
      product.category ? `Category: ${product.category}` : '',
      '',
      'Please confirm availability and price.',
    ]
      .filter(Boolean)
      .join('\n');

    return `https://wa.me/923336724500?text=${encodeURIComponent(message)}`;
  }

  // ============================================================
  // PLACEHOLDER
  // ============================================================

  placeholderImage(name: string): string {
    return `https://placehold.co/800x600/e9e9e5/303338?text=${encodeURIComponent(
      name || 'Auto Part',
    )}`;
  }

  // ============================================================
  // RESOLVE RELATION
  // ============================================================

  private resolveName(value: any, collection: any[]): string {
    if (!value) {
      return '';
    }

    // Already a string name
    if (typeof value === 'string') {
      const found = collection.find(
        (item: any) =>
          String(item.id) === value || String(item.name).toLowerCase() === value.toLowerCase(),
      );

      return found?.name ?? value;
    }

    // Object relation
    if (typeof value === 'object') {
      return value.name ?? value.title ?? value.label ?? '';
    }

    // Numeric/string ID
    const found = collection.find((item: any) => String(item.id) === String(value));

    return found?.name ?? '';
  }

  // ============================================================
  // NORMALIZE
  // ============================================================

  private normalize(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  // ============================================================
  // UNIQUE SORTED
  // ============================================================

  private uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
  }
  
}
