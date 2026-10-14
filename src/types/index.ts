export type ExpiryStatus = 'critical' | 'warning' | 'normal';

export interface ShopkeeperProfile {
  id: string;
  fullName: string;
  shopName: string;
  phone: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  role: 'owner' | 'manager' | 'staff';
  tradeLicenseNo: string;
  licenseType: string;
  issuingAuthority: string;
  licenseExpiryDate: string;
  businessCategory: string;
  preferredLanguage: 'en' | 'hi' | 'hinglish';
  notificationsEnabled: boolean;
  audioAlertsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  warningThresholdDays: number; // default 7
  criticalThresholdDays: number; // default 2
}

export interface Batch {
  id: string;
  productId: string;
  productName?: string;
  batchNumber: string;
  receivedDate: string;
  expiryDate: string;
  originalQty: number;
  currentQty: number;
  unit: string;
  purchaseCost: number;
  supplierId: string;
  supplierName: string;
  status: 'active' | 'quarantined' | 'recalled' | 'written_off' | 'recovered' | 'depleted';
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  barcode: string;
  sku: string;
  unit: string;
  reorderLevel: number;
  sellingPrice: number;
  mrp: number;
  image?: string;
  description?: string;
  isDemo?: boolean;
  batches?: Batch[];
}

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  type: 'receipt' | 'sale' | 'adjustment' | 'write_off' | 'recovery_transfer';
  quantity: number;
  unit: string;
  reason: string;
  referenceNo?: string;
  performedBy: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  type: 'critical_expiry' | 'warning_expiry' | 'low_stock' | 'po_overdue' | 'system';
  title: string;
  message: string;
  batchId?: string;
  productId?: string;
  read: boolean;
  reviewed: boolean;
  acknowledgementStep?: number; // 1: opened, 2: reviewed action, 3: confirmed
}

export type RecipientCategory = 'cattle_farmer' | 'ngo_foodbank' | 'chemist_retailer';

export interface FoodRecoveryRecipient {
  id: string;
  name: string;
  category: RecipientCategory;
  categoryLabel: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  address: string;
  locality: string;
  distanceKm: number;
  acceptedCategories: string[];
  acceptanceConditions: string;
  verified: boolean;
  active: boolean;
  notes?: string;
}

export interface RecoveryTransferRecord {
  id: string;
  timestamp: string;
  batchId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  recipientId: string;
  recipientName: string;
  recipientCategory: RecipientCategory;
  purposeNotes: string;
  contactPerson: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  wastePreventedKg: number;
  capitalSavedInr: number;
}

export interface InvoiceLineItem {
  id: string;
  productName: string;
  brand: string;
  category: string;
  barcode: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  batchNumber: string;
  expiryDate: string;
  hasMissingExpiry: boolean;
  confidence: number;
}

export interface InvoiceExtraction {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  confidence: number;
  duplicateDetected: boolean;
  items: InvoiceLineItem[];
  rawText?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  leadTimeDays: number;
  minOrderQty: number;
  paymentTerms: string;
  rating: number;
  suppliedCategories: string[];
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
}

export interface FestivalPlanItem {
  productId: string;
  productName: string;
  category: string;
  baselineDemand: number;
  demandMultiplier: number;
  forecastDemand: number;
  currentStock: number;
  incomingStock: number;
  suggestedReorderQty: number;
  unitCost: number;
  estimatedCost: number;
  leadTimeDays: number;
  supplierWarning?: string;
}

export interface FestivalPlan {
  id: string;
  festivalName: string;
  date: string;
  preparationWeeks: number;
  categories: string[];
  targetBudget: number;
  estimatedCost: number;
  status: 'draft' | 'active' | 'ordered';
  items: FestivalPlanItem[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  category: 'expiry_priority' | 'reorder_now' | 'slow_moving' | 'budget_optimization' | 'festival_prep' | 'supplier_risk';
  categoryLabel: string;
  urgency: 'high' | 'medium' | 'low';
  actionSuggested: string;
  whyItMatters: string;
  supportingRecords: string;
  assumptions: string;
  actionLabel: string;
  actionType: 'discount_sale' | 'reorder' | 'recovery' | 'festival' | 'review';
  relatedId?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SaleRecord {
  id: string;
  timestamp: string;
  invoiceNo: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: 'cash' | 'upi' | 'credit_udhaar';
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}
