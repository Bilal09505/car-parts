export interface Category {
  id?: string;
  name: string;
}

export interface Product {
  id?: string;
  name: string;
  category: string;
  vehicleModel: string;
  unit: string;
  reorderLevel: number;
  currentSalePrice: number;
  createdAt?: any;
}

export interface Lot {
  id?: string;
  productId: string;
  productName: string;      // denormalized for fast list display
  purchasePrice: number;
  quantityPurchased: number;
  quantityRemaining: number;
  quantitySold: number;
  totalProfit: number;
  purchaseId: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: any;
  active: boolean;
}

export interface Purchase {
  id?: string;
  supplierId: string;
  supplierName: string;
  date: any;
  totalCost: number;
  lotIds: string[];
  items: { productId: string; productName: string; quantity: number; unitCost: number }[];
}

export interface SaleItem {
  id?: string;
  saleId: string;
  lotId: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
  profit: number;
  date: any;
}

export interface Sale {
  id?: string;
  customerId: string | null;
  customerName: string;
  date: any;
  totalAmount: number;
  totalProfit: number;
  itemCount: number;
}

export interface Supplier {
  id?: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // positive = we owe them
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // positive = they owe us
}
