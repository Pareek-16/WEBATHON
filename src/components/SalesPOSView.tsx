import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Printer, 
  AlertTriangle, 
  Clock, 
  X,
  IndianRupee,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Batch, SaleRecord, ShopkeeperProfile } from '../types';
import { storage, getDaysRemaining } from '../services/storage';
import { audioAlerts } from '../services/audioAlerts';

interface SalesPOSViewProps {
  products: Product[];
  batches: Batch[];
  profile: ShopkeeperProfile;
  initialBatchId?: string;
}

interface CartItem {
  product: Product;
  batch: Batch;
  quantity: number;
}

export const SalesPOSView: React.FC<SalesPOSViewProps> = ({
  products,
  batches,
  profile,
  initialBatchId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'credit_udhaar'>('upi');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const activeBatches = batches.filter(b => b.status === 'active' && b.currentQty > 0);

  // Filter products for quick POS entry
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.brand.toLowerCase().includes(q);
  });

  // Add item to cart with FEFO batch selection
  const addToCart = (product: Product, specificBatch?: Batch) => {
    // Find batches for this product, sorted by FEFO (earliest expiry first)
    const prodBatches = activeBatches
      .filter(b => b.productId === product.id)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    // Filter out expired batches (expired batches cannot be sold for human consumption)
    const validBatches = prodBatches.filter(b => getDaysRemaining(b.expiryDate) >= 0);

    const chosenBatch = specificBatch || validBatches[0];

    if (!chosenBatch) {
      alert(`No valid in-date batches available for ${product.name}. All existing batches may be expired or out of stock.`);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.batch.id === chosenBatch.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        if (updated[existingIndex].quantity < chosenBatch.currentQty) {
          updated[existingIndex].quantity += 1;
        } else {
          alert(`Cannot add more than available batch stock (${chosenBatch.currentQty} ${chosenBatch.unit}).`);
        }
        return updated;
      }
      return [...prev, { product, batch: chosenBatch, quantity: 1 }];
    });
  };

  const updateCartQty = (batchId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.batch.id === batchId) {
          const newQty = item.quantity + delta;
          if (newQty > item.batch.currentQty) {
            alert(`Maximum stock available in this batch is ${item.batch.currentQty} ${item.batch.unit}.`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (batchId: string) => {
    setCart(prev => prev.filter(item => item.batch.id !== batchId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'upi') {
      setShowUpiModal(true);
      return;
    }

    finalizeSale();
  };

  const finalizeSale = () => {
    const saleRecord: Omit<SaleRecord, 'id' | 'timestamp'> = {
      invoiceNo: `BILL-${Date.now().toString().slice(-6)}`,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        batchId: item.batch.id,
        batchNumber: item.batch.batchNumber,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPrice: item.product.sellingPrice,
        total: item.product.sellingPrice * item.quantity,
      })),
      subtotal,
      discount: discountAmount,
      tax: 0,
      total,
    };

    const saved = storage.recordSale(saleRecord);
    setCompletedSale(saved);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountAmount(0);
    setShowUpiModal(false);

    audioAlerts.playSuccessTone();
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Sales & Billing Counter (POS)</h1>
            <span className="badge badge-normal" style={{ fontSize: 12 }}>FEFO Protected</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Fast kirana counter billing. Automatically routes sales through the earliest-expiring batch.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Left: Product Search & Quick Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 36, height: 42 }}
                placeholder="Scan barcode or type product name (e.g. Parle, Atta, Maggi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="card" style={{ padding: 18, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
              Product Catalogue ({filteredProducts.length})
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {filteredProducts.map(prod => {
                const prodBatches = activeBatches.filter(b => b.productId === prod.id);
                const totalStock = prodBatches.reduce((a, b) => a + b.currentQty, 0);
                const isOutOfStock = totalStock === 0;

                // Sorted by FEFO
                const sorted = [...prodBatches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                const earliestBatch = sorted[0];
                const daysRemaining = earliestBatch ? getDaysRemaining(earliestBatch.expiryDate) : null;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    style={{
                      padding: 12,
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: isOutOfStock ? '#F8FAF9' : '#FFFFFF',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.6 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) e.currentTarget.style.borderColor = 'var(--forest-green)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{prod.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {prod.brand} &bull; {prod.category.split('&')[0]}
                      </div>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--forest-green)' }}>
                        ₹{prod.sellingPrice}
                      </div>
                      <span className={`badge ${isOutOfStock ? 'badge-critical' : 'badge-neutral'}`} style={{ fontSize: 10.5 }}>
                        {isOutOfStock ? 'Out of Stock' : `${totalStock} ${prod.unit}`}
                      </span>
                    </div>

                    {earliestBatch && (
                      <div style={{ fontSize: 10.5, color: daysRemaining! <= 7 ? '#9A6605' : 'var(--text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        <span>FEFO: {daysRemaining! <= 0 ? 'Today' : `${daysRemaining}d left`} ({earliestBatch.batchNumber})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart, Customer Info & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div className="card-title">
                <ShoppingCart size={18} color="var(--forest-green)" />
                <span>Current Basket ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
              </div>
              {cart.length > 0 && (
                <button className="btn btn-xs btn-secondary" onClick={() => setCart([])}>
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  Cart is empty. Select products on the left or scan barcode.
                </div>
              ) : (
                cart.map(item => {
                  const days = getDaysRemaining(item.batch.expiryDate);
                  return (
                    <div
                      key={item.batch.id}
                      style={{
                        padding: 10,
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        background: '#FAFBFB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.product.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 6, marginTop: 2 }}>
                          <span>Batch: {item.batch.batchNumber}</span> &bull;
                          <span style={{ color: days <= 7 ? '#9A6605' : 'inherit' }}>
                            Expires: {item.batch.expiryDate} ({days}d)
                          </span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest-green)', marginTop: 2 }}>
                          ₹{item.product.sellingPrice} &times; {item.quantity} = ₹{item.product.sellingPrice * item.quantity}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => updateCartQty(item.batch.id, -1)}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => updateCartQty(item.batch.id, 1)}>
                          <Plus size={12} />
                        </button>
                        <button className="icon-btn" style={{ width: 26, height: 26, color: 'var(--critical-red)' }} onClick={() => removeFromCart(item.batch.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Customer Details */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: 36, fontSize: 12.5 }}
                  placeholder="Customer Name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ height: 36, fontSize: 12.5 }}
                  placeholder="Mobile (10 digits)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Payment Method
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { id: 'upi', label: 'UPI / QR', icon: QrCode },
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'credit_udhaar', label: 'Udhaar', icon: CreditCard },
                ].map(pm => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 4, height: 'auto' }}
                      onClick={() => setPaymentMethod(pm.id as any)}
                    >
                      <Icon size={16} />
                      <span style={{ fontSize: 11 }}>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bill Summary */}
            <div style={{ background: '#F8FAF9', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                <input
                  type="number"
                  min="0"
                  style={{ width: 60, height: 24, fontSize: 12, textAlign: 'right', border: '1px solid var(--border-color)', borderRadius: 4 }}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 6, fontWeight: 700, fontSize: 16, color: 'var(--forest-green)' }}>
                <span>Total Amount:</span>
                <span>₹{total}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', height: 46, fontSize: 15 }}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              <span>Charge ₹{total} ({paymentMethod.toUpperCase()})</span>
              <CheckCircle2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* UPI QR CODE MODAL */}
      {showUpiModal && (
        <div className="modal-overlay" onClick={() => setShowUpiModal(false)}>
          <div className="modal-content" style={{ maxWidth: 380, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="heading-3">Scan UPI QR to Pay</h3>
              <button className="icon-btn" onClick={() => setShowUpiModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Pay directly to <strong>{profile.shopName}</strong>
              </div>

              {/* Dynamic QR code placeholder SVG */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-accent)', padding: 16, borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(124, 58, 237, 0.2)' }}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <rect width="180" height="180" fill="#FFFFFF" />
                  {/* Outer corner boxes */}
                  <rect x="10" y="10" width="45" height="45" fill="#1E1B4B" />
                  <rect x="16" y="16" width="33" height="33" fill="#FFFFFF" />
                  <rect x="22" y="22" width="21" height="21" fill="#7C3AED" />

                  <rect x="125" y="10" width="45" height="45" fill="#1E1B4B" />
                  <rect x="131" y="16" width="33" height="33" fill="#FFFFFF" />
                  <rect x="137" y="22" width="21" height="21" fill="#7C3AED" />

                  <rect x="10" y="125" width="45" height="45" fill="#1E1B4B" />
                  <rect x="16" y="131" width="33" height="33" fill="#FFFFFF" />
                  <rect x="22" y="137" width="21" height="21" fill="#7C3AED" />

                  {/* Sample QR pattern dots */}
                  <rect x="65" y="15" width="10" height="10" fill="#1E1B4B" />
                  <rect x="85" y="25" width="10" height="10" fill="#7C3AED" />
                  <rect x="70" y="45" width="15" height="10" fill="#1E1B4B" />
                  <rect x="20" y="65" width="20" height="10" fill="#7C3AED" />
                  <rect x="65" y="65" width="50" height="50" fill="#1E1B4B" rx="6" />
                  <circle cx="90" cy="90" r="14" fill="#A855F7" />
                  <rect x="125" y="65" width="20" height="15" fill="#7C3AED" />
                  <rect x="65" y="125" width="20" height="20" fill="#1E1B4B" />
                  <rect x="95" y="135" width="30" height="15" fill="#7C3AED" />
                  <rect x="135" y="125" width="25" height="25" fill="#1E1B4B" />
                </svg>
              </div>

              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--forest-green)' }}>
                ₹{total}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                VPA: <strong>sharmakirana@okhdfcbank</strong>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-mint" style={{ width: '100%' }} onClick={finalizeSale}>
                <CheckCircle2 size={16} />
                <span>Payment Received (Done)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE RECEIPT MODAL */}
      {completedSale && (
        <div className="modal-overlay" onClick={() => setCompletedSale(null)}>
          <div className="modal-content" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="heading-3">Receipt Preview</h3>
              <button className="icon-btn" onClick={() => setCompletedSale(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.5, background: '#FAFCFA', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{profile.shopName}</div>
                <div>{profile.address}, {profile.locality}</div>
                <div>Phone: {profile.phone} &bull; FSSAI: {profile.tradeLicenseNo}</div>
                <div style={{ borderBottom: '1px dashed #CAD5CE', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span>Bill: {completedSale.invoiceNo}</span>
                  <span>{new Date(completedSale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div style={{ borderBottom: '1px dashed #CAD5CE', paddingBottom: 6, marginBottom: 6 }}>
                {completedSale.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ maxWidth: 220 }}>
                      <div>{it.productName}</div>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>({it.batchNumber})</span>
                    </div>
                    <div>
                      {it.quantity} &times; {it.unitPrice} = ₹{it.total}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>Subtotal:</span>
                <span>₹{completedSale.subtotal}</span>
              </div>
              {completedSale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--forest-green)' }}>
                  <span>Discount:</span>
                  <span>-₹{completedSale.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, borderTop: '1px dashed #CAD5CE', paddingTop: 6, marginTop: 4 }}>
                <span>TOTAL:</span>
                <span>₹{completedSale.total}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 12 }}>
                Payment: {completedSale.paymentMethod.toUpperCase()} &bull; Thank you for shopping!
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
              <button className="btn btn-primary" onClick={() => setCompletedSale(null)}>
                <span>New Transaction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
