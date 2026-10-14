import { 
  ShopkeeperProfile, 
  Product, 
  Batch, 
  Supplier, 
  PurchaseOrder, 
  StockMovement, 
  SaleRecord, 
  NotificationItem, 
  FoodRecoveryRecipient, 
  RecoveryTransferRecord, 
  FestivalPlan, 
  ExpiryStatus 
} from '../types';
import { 
  defaultProfile, 
  initialProducts, 
  initialBatches, 
  initialSuppliers, 
  initialPurchaseOrders, 
  initialStockMovements, 
  initialSales, 
  initialRecipients, 
  initialFestivalPlans,
  formatDateOffset 
} from '../data/seedData';

const KEYS = {
  PROFILE: 'smartstock_profile_v1',
  PRODUCTS: 'smartstock_products_v1',
  BATCHES: 'smartstock_batches_v1',
  SUPPLIERS: 'smartstock_suppliers_v1',
  PURCHASE_ORDERS: 'smartstock_pos_v1',
  STOCK_MOVEMENTS: 'smartstock_movements_v1',
  SALES: 'smartstock_sales_v1',
  NOTIFICATIONS: 'smartstock_notifications_v1',
  RECIPIENTS: 'smartstock_recipients_v1',
  RECOVERY_TRANSFERS: 'smartstock_transfers_v1',
  FESTIVAL_PLANS: 'smartstock_festival_plans_v1',
  DEMO_MODE: 'smartstock_demo_mode_v1',
};

const notifyChange = () => {
  window.dispatchEvent(new CustomEvent('smartstock_update'));
};

export const getDaysRemaining = (expiryDateStr: string): number => {
  if (!expiryDateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (
  batch: Batch, 
  warningDays = 7, 
  criticalDays = 0
): ExpiryStatus => {
  const days = getDaysRemaining(batch.expiryDate);
  if (days <= criticalDays) return 'critical';
  if (days <= warningDays) return 'warning';
  return 'normal';
};

export const storage = {
  init() {
    if (!localStorage.getItem(KEYS.PROFILE)) {
      this.resetAll();
    } else {
      // Generate real-time dynamic notifications based on existing batches
      this.refreshNotifications();
    }
  },

  resetAll() {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(defaultProfile));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(initialProducts));
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(initialBatches));
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(initialSuppliers));
    localStorage.setItem(KEYS.PURCHASE_ORDERS, JSON.stringify(initialPurchaseOrders));
    localStorage.setItem(KEYS.STOCK_MOVEMENTS, JSON.stringify(initialStockMovements));
    localStorage.setItem(KEYS.SALES, JSON.stringify(initialSales));
    localStorage.setItem(KEYS.RECIPIENTS, JSON.stringify(initialRecipients));
    localStorage.setItem(KEYS.RECOVERY_TRANSFERS, JSON.stringify([]));
    localStorage.setItem(KEYS.FESTIVAL_PLANS, JSON.stringify(initialFestivalPlans));
    localStorage.setItem(KEYS.DEMO_MODE, 'true');
    this.refreshNotifications();
    notifyChange();
  },

  // Profile
  getProfile(): ShopkeeperProfile {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : defaultProfile;
  },
  saveProfile(profile: ShopkeeperProfile) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    notifyChange();
  },

  // Products
  getProducts(): Product[] {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    const products: Product[] = data ? JSON.parse(data) : [];
    const batches = this.getBatches();
    // Attach batches to products
    return products.map(p => ({
      ...p,
      batches: batches.filter(b => b.productId === p.id && b.status === 'active')
    }));
  },
  saveProduct(product: Product) {
    const list = this.getProducts().map(({ batches, ...rest }) => rest);
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    notifyChange();
  },
  deleteProduct(id: string) {
    const list = this.getProducts().map(({ batches, ...rest }) => rest).filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    // Also remove related batches
    const batches = this.getBatches().filter(b => b.productId !== id);
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(batches));
    notifyChange();
  },

  // Batches
  getBatches(): Batch[] {
    const data = localStorage.getItem(KEYS.BATCHES);
    return data ? JSON.parse(data) : [];
  },
  saveBatch(batch: Batch) {
    const list = this.getBatches();
    const idx = list.findIndex(b => b.id === batch.id);
    if (idx >= 0) {
      list[idx] = batch;
    } else {
      list.unshift(batch);
    }
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(list));
    this.refreshNotifications();
    notifyChange();
  },
  updateBatchStatus(batchId: string, status: Batch['status']) {
    const list = this.getBatches();
    const batch = list.find(b => b.id === batchId);
    if (batch) {
      batch.status = status;
      localStorage.setItem(KEYS.BATCHES, JSON.stringify(list));
      notifyChange();
    }
  },

  // Stock Movement & Adjustments (Transactional)
  recordMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>) {
    const movements: StockMovement[] = this.getMovements();
    const newMovement: StockMovement = {
      ...movement,
      id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    movements.unshift(newMovement);
    localStorage.setItem(KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
    notifyChange();
    return newMovement;
  },
  getMovements(): StockMovement[] {
    const data = localStorage.getItem(KEYS.STOCK_MOVEMENTS);
    return data ? JSON.parse(data) : [];
  },

  adjustBatchQty(
    batchId: string, 
    deltaQty: number, 
    type: StockMovement['type'], 
    reason: string, 
    performedBy = 'Rajesh Sharma (Owner)'
  ) {
    const batches = this.getBatches();
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return false;

    const previousQty = batch.currentQty;
    const newQty = Math.max(0, previousQty + deltaQty);
    batch.currentQty = newQty;
    if (newQty === 0) {
      batch.status = type === 'recovery_transfer' ? 'recovered' : (type === 'write_off' ? 'written_off' : 'depleted');
    }

    localStorage.setItem(KEYS.BATCHES, JSON.stringify(batches));

    // Record audit trail
    this.recordMovement({
      productId: batch.productId,
      productName: batch.productName || 'Unknown Product',
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      type,
      quantity: Math.abs(deltaQty),
      unit: batch.unit,
      reason,
      performedBy,
    });

    this.refreshNotifications();
    notifyChange();
    return true;
  },

  // Recovery Transfers
  getRecoveryTransfers(): RecoveryTransferRecord[] {
    const data = localStorage.getItem(KEYS.RECOVERY_TRANSFERS);
    return data ? JSON.parse(data) : [];
  },
  executeRecoveryTransfer(transferData: Omit<RecoveryTransferRecord, 'id' | 'timestamp' | 'status'>) {
    const transfers = this.getRecoveryTransfers();
    const record: RecoveryTransferRecord = {
      ...transferData,
      id: 'rec_tr_' + Date.now(),
      timestamp: new Date().toISOString(),
      status: 'completed',
    };
    transfers.unshift(record);
    localStorage.setItem(KEYS.RECOVERY_TRANSFERS, JSON.stringify(transfers));

    // Deduct stock from the batch
    this.adjustBatchQty(
      transferData.batchId,
      -transferData.quantity,
      'recovery_transfer',
      `Transferred to ${transferData.recipientName} (${transferData.recipientCategory}): ${transferData.purposeNotes}`,
      'Rajesh Sharma (Owner)'
    );

    notifyChange();
    return record;
  },

  // Recipients
  getRecipients(): FoodRecoveryRecipient[] {
    const data = localStorage.getItem(KEYS.RECIPIENTS);
    return data ? JSON.parse(data) : [];
  },
  saveRecipient(recipient: FoodRecoveryRecipient) {
    const list = this.getRecipients();
    const idx = list.findIndex(r => r.id === recipient.id);
    if (idx >= 0) {
      list[idx] = recipient;
    } else {
      list.push(recipient);
    }
    localStorage.setItem(KEYS.RECIPIENTS, JSON.stringify(list));
    notifyChange();
  },

  // Sales
  getSales(): SaleRecord[] {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },
  recordSale(saleData: Omit<SaleRecord, 'id' | 'timestamp'>) {
    const sales = this.getSales();
    const record: SaleRecord = {
      ...saleData,
      id: 'sale_' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    sales.unshift(record);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));

    // Deduct each item from batch
    for (const item of saleData.items) {
      this.adjustBatchQty(
        item.batchId,
        -item.quantity,
        'sale',
        `Sold under Invoice ${saleData.invoiceNo} to ${saleData.customerName || 'Walk-in'}`,
        'Staff Cashier'
      );
    }

    notifyChange();
    return record;
  },

  // Suppliers & Purchase Orders
  getSuppliers(): Supplier[] {
    const data = localStorage.getItem(KEYS.SUPPLIERS);
    return data ? JSON.parse(data) : [];
  },
  saveSupplier(sup: Supplier) {
    const list = this.getSuppliers();
    const idx = list.findIndex(s => s.id === sup.id);
    if (idx >= 0) {
      list[idx] = sup;
    } else {
      list.push(sup);
    }
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(list));
    notifyChange();
  },

  getPurchaseOrders(): PurchaseOrder[] {
    const data = localStorage.getItem(KEYS.PURCHASE_ORDERS);
    return data ? JSON.parse(data) : [];
  },
  savePurchaseOrder(po: PurchaseOrder) {
    const list = this.getPurchaseOrders();
    const idx = list.findIndex(p => p.id === po.id);
    if (idx >= 0) {
      list[idx] = po;
    } else {
      list.unshift(po);
    }
    localStorage.setItem(KEYS.PURCHASE_ORDERS, JSON.stringify(list));
    notifyChange();
  },

  receivePurchaseOrder(
    poId: string,
    receivedLines: {
      productId: string;
      productName: string;
      qty: number;
      unit: string;
      unitCost: number;
      batchNumber: string;
      expiryDate: string;
    }[]
  ) {
    const pos = this.getPurchaseOrders();
    const po = pos.find(p => p.id === poId);
    if (!po) return false;

    po.status = 'received';
    localStorage.setItem(KEYS.PURCHASE_ORDERS, JSON.stringify(pos));

    // Create new batches & stock movement receipts
    for (const line of receivedLines) {
      const newBatch: Batch = {
        id: 'batch_po_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        productId: line.productId,
        productName: line.productName,
        batchNumber: line.batchNumber || `B-${Date.now().toString().slice(-4)}`,
        receivedDate: new Date().toISOString().split('T')[0],
        expiryDate: line.expiryDate || formatDateOffset(180),
        originalQty: line.qty,
        currentQty: line.qty,
        unit: line.unit,
        purchaseCost: line.unitCost,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        status: 'active',
      };
      this.saveBatch(newBatch);

      this.recordMovement({
        productId: line.productId,
        productName: line.productName,
        batchId: newBatch.id,
        batchNumber: newBatch.batchNumber,
        type: 'receipt',
        quantity: line.qty,
        unit: line.unit,
        reason: `Goods receipt for Purchase Order ${po.poNumber}`,
        referenceNo: po.poNumber,
        performedBy: 'Rajesh Sharma (Owner)',
      });
    }

    notifyChange();
    return true;
  },

  // Festival Plans
  getFestivalPlans(): FestivalPlan[] {
    const data = localStorage.getItem(KEYS.FESTIVAL_PLANS);
    return data ? JSON.parse(data) : [];
  },
  saveFestivalPlan(plan: FestivalPlan) {
    const list = this.getFestivalPlans();
    const idx = list.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      list[idx] = plan;
    } else {
      list.unshift(plan);
    }
    localStorage.setItem(KEYS.FESTIVAL_PLANS, JSON.stringify(list));
    notifyChange();
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },
  saveNotifications(items: NotificationItem[]) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(items));
    notifyChange();
  },
  markNotificationReviewed(id: string) {
    const notifs = this.getNotifications();
    const n = notifs.find(item => item.id === id);
    if (n) {
      n.reviewed = true;
      n.read = true;
      n.acknowledgementStep = 3;
      this.saveNotifications(notifs);
    }
  },
  setNotificationStep(id: string, step: number) {
    const notifs = this.getNotifications();
    const n = notifs.find(item => item.id === id);
    if (n) {
      n.acknowledgementStep = step;
      if (step === 3) {
        n.reviewed = true;
        n.read = true;
      }
      this.saveNotifications(notifs);
    }
  },

  refreshNotifications() {
    const batches = this.getBatches().filter(b => b.status === 'active' && b.currentQty > 0);
    const products = this.getProducts();
    const existing = this.getNotifications();
    const generated: NotificationItem[] = [];

    // Check batches for expiry
    for (const b of batches) {
      const days = getDaysRemaining(b.expiryDate);
      if (days < 0) {
        const id = `notif_exp_${b.id}`;
        const prev = existing.find(e => e.id === id);
        generated.push({
          id,
          timestamp: prev?.timestamp || new Date().toISOString(),
          type: 'critical_expiry',
          title: `Expired Stock Alert: ${b.productName || 'Batch ' + b.batchNumber}`,
          message: `Batch ${b.batchNumber} (${b.currentQty} ${b.unit}) expired ${Math.abs(days)} day(s) ago. Blocked from human sale. Immediate action required.`,
          batchId: b.id,
          productId: b.productId,
          read: prev?.read || false,
          reviewed: prev?.reviewed || false,
          acknowledgementStep: prev?.acknowledgementStep || 1,
        });
      } else if (days === 0) {
        const id = `notif_today_${b.id}`;
        const prev = existing.find(e => e.id === id);
        generated.push({
          id,
          timestamp: prev?.timestamp || new Date().toISOString(),
          type: 'critical_expiry',
          title: `Critical: Expires Today — ${b.productName}`,
          message: `Batch ${b.batchNumber} with ${b.currentQty} ${b.unit} expires by end of day today. Prioritize FEFO sale or route to recovery.`,
          batchId: b.id,
          productId: b.productId,
          read: prev?.read || false,
          reviewed: prev?.reviewed || false,
          acknowledgementStep: prev?.acknowledgementStep || 1,
        });
      } else if (days <= 7) {
        const id = `notif_warn_${b.id}`;
        const prev = existing.find(e => e.id === id);
        generated.push({
          id,
          timestamp: prev?.timestamp || new Date().toISOString(),
          type: 'warning_expiry',
          title: `7-Day Expiry Warning: ${b.productName}`,
          message: `Batch ${b.batchNumber} (${b.currentQty} ${b.unit}) has ${days} day(s) remaining. Expected sell-through requires promotion.`,
          batchId: b.id,
          productId: b.productId,
          read: prev?.read || false,
          reviewed: prev?.reviewed || false,
          acknowledgementStep: prev?.acknowledgementStep || 1,
        });
      }
    }

    // Check low stock
    for (const p of products) {
      const totalStock = (p.batches || []).reduce((acc, b) => acc + b.currentQty, 0);
      if (totalStock > 0 && totalStock <= p.reorderLevel) {
        const id = `notif_low_${p.id}`;
        const prev = existing.find(e => e.id === id);
        generated.push({
          id,
          timestamp: prev?.timestamp || new Date().toISOString(),
          type: 'low_stock',
          title: `Low Stock Alert: ${p.name}`,
          message: `Current stock (${totalStock} ${p.unit}) is at or below reorder threshold (${p.reorderLevel} ${p.unit}). Consider placing a PO.`,
          productId: p.id,
          read: prev?.read || false,
          reviewed: prev?.reviewed || false,
        });
      }
    }

    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(generated));
  },

  // Demo Mode
  isDemoMode(): boolean {
    return localStorage.getItem(KEYS.DEMO_MODE) !== 'false';
  },
  setDemoMode(val: boolean) {
    localStorage.setItem(KEYS.DEMO_MODE, val ? 'true' : 'false');
    notifyChange();
  },
};
