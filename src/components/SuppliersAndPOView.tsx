import React, { useState } from 'react';
import { 
  Truck, 
  ClipboardList, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight, 
  X, 
  Package, 
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Supplier, PurchaseOrder, Product, Batch, ShopkeeperProfile } from '../types';
import { storage } from '../services/storage';
import { audioAlerts } from '../services/audioAlerts';

interface SuppliersAndPOProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  profile: ShopkeeperProfile;
  initialTab?: 'suppliers' | 'orders';
}

export const SuppliersAndPOView: React.FC<SuppliersAndPOProps> = ({
  suppliers,
  purchaseOrders,
  products,
  profile,
  initialTab = 'orders',
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>(initialTab);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState<PurchaseOrder | null>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // Form states for Create PO
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; qty: number; unitCost: number }[]>([
    { productId: products[0]?.id || '', qty: 20, unitCost: 100 }
  ]);

  // Form states for Receive Goods
  const [receiveLines, setReceiveLines] = useState<{
    productId: string;
    productName: string;
    qty: number;
    unit: string;
    unitCost: number;
    batchNumber: string;
    expiryDate: string;
  }[]>([]);

  // Add line to PO
  const addPoLine = () => {
    setPoItems(prev => [...prev, { productId: products[0]?.id || '', qty: 10, unitCost: 50 }]);
  };

  const removePoLine = (index: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const updatePoLine = (index: number, field: string, val: any) => {
    setPoItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

    let totalAmount = 0;
    const items = poItems.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      const total = item.qty * item.unitCost;
      totalAmount += total;
      return {
        productId: item.productId,
        productName: p?.name || 'Product',
        quantity: item.qty,
        unit: p?.unit || 'pack',
        unitCost: item.unitCost,
        totalCost: total,
        receivedQty: 0,
      };
    });

    const newPO: PurchaseOrder = {
      id: 'po_' + Date.now(),
      poNumber: `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: poExpectedDate || new Date(Date.now() + 86400000 * sup.leadTimeDays).toISOString().split('T')[0],
      status: 'ordered',
      totalAmount,
      items,
      notes: poNotes,
    };

    storage.savePurchaseOrder(newPO);
    setShowCreatePOModal(false);
    setPoNotes('');
    audioAlerts.playSuccessTone();
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    const lines = po.items.map(item => {
      const defaultExp = new Date();
      defaultExp.setDate(defaultExp.getDate() + 90);
      return {
        productId: item.productId,
        productName: item.productName,
        qty: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        batchNumber: `B-${Date.now().toString().slice(-4)}`,
        expiryDate: defaultExp.toISOString().split('T')[0],
      };
    });
    setReceiveLines(lines);
    setShowReceiveModal(po);
  };

  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReceiveModal) return;

    storage.receivePurchaseOrder(showReceiveModal.id, receiveLines);

    audioAlerts.playSuccessTone();
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    setShowReceiveModal(null);
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Procurement & Supplier Management</h1>
            <span className="badge badge-neutral" style={{ fontSize: 12 }}>B2B Logistics</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Track supplier lead times, minimum order quantities, and purchase order fulfillment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowCreatePOModal(true)}>
            <Plus size={16} />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
        <button
          className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('orders')}
        >
          <ClipboardList size={15} />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Truck size={15} />
          <span>Suppliers Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier Details</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th>Items Ordered</th>
                <th>Total Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(po => {
                const isReceived = po.status === 'received';
                return (
                  <tr key={po.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5 }}>
                        {po.poNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{po.supplierName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {po.notes || 'Routine replenishment'}
                      </div>
                    </td>
                    <td>{po.orderDate}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{po.expectedDeliveryDate}</span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {po.items.length} item{po.items.length !== 1 ? 's' : ''} ({po.items.reduce((a, b) => a + b.quantity, 0)} units)
                      </span>
                    </td>
                    <td>
                      <strong>₹{po.totalAmount.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className={`badge ${isReceived ? 'badge-normal' : 'badge-warning'}`}>
                        {isReceived ? 'Received in Stock' : 'Ordered & In Transit'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!isReceived ? (
                        <button
                          className="btn btn-mint btn-xs"
                          onClick={() => openReceiveModal(po)}
                          title="Verify delivery and create stock batches"
                        >
                          <CheckCircle2 size={13} />
                          <span>Receive Goods</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: 11.5, color: '#0E683E', fontWeight: 600 }}>
                          ✓ Stock Updated
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16
        }}>
          {suppliers.map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 className="heading-3">{s.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Contact: <strong>{s.contactPerson}</strong>
                    </div>
                  </div>
                  <span className="badge badge-normal" style={{ fontSize: 11 }}>
                    ★ {s.rating}
                  </span>
                </div>

                <div style={{ margin: '14px 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <MapPin size={13} />
                    <span>{s.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} />
                    <a href={`tel:${s.phone}`} style={{ color: 'var(--forest-green)', textDecoration: 'none', fontWeight: 600 }}>
                      +91 {s.phone}
                    </a>
                  </div>
                </div>

                <div style={{ background: '#F8FAF9', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Lead Time:</span>
                    <strong>{s.leadTimeDays} days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Min Order Qty (MOQ):</span>
                    <strong>{s.minOrderQty} units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Payment Terms:</span>
                    <span>{s.paymentTerms}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', gap: 8 }}>
                <a href={`tel:${s.phone}`} className="btn btn-secondary btn-xs" style={{ flex: 1 }}>
                  <Phone size={12} />
                  <span>Call</span>
                </a>
                <button 
                  className="btn btn-primary btn-xs" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setSelectedSupplierId(s.id);
                    setShowCreatePOModal(true);
                  }}
                >
                  <Plus size={12} />
                  <span>Draft PO</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {showCreatePOModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePOModal(false)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="heading-3">Draft New Purchase Order</h3>
              <button className="icon-btn" onClick={() => setShowCreatePOModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePO}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Select Supplier *</label>
                    <select
                      className="form-control"
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.leadTimeDays}d lead time)</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expected Delivery Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={poExpectedDate}
                      onChange={(e) => setPoExpectedDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Order Line Items</label>
                    <button type="button" className="btn btn-xs btn-secondary" onClick={addPoLine}>
                      <Plus size={12} />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                    {poItems.map((line, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAF9', padding: 8, borderRadius: 'var(--radius-sm)' }}>
                        <select
                          className="form-control"
                          style={{ height: 34, fontSize: 12.5, flex: 2 }}
                          value={line.productId}
                          onChange={(e) => updatePoLine(idx, 'productId', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          className="form-control"
                          style={{ height: 34, width: 75, fontSize: 12.5 }}
                          placeholder="Qty"
                          min="1"
                          value={line.qty}
                          onChange={(e) => updatePoLine(idx, 'qty', Number(e.target.value))}
                        />

                        <input
                          type="number"
                          className="form-control"
                          style={{ height: 34, width: 85, fontSize: 12.5 }}
                          placeholder="Cost (₹)"
                          min="1"
                          value={line.unitCost}
                          onChange={(e) => updatePoLine(idx, 'unitCost', Number(e.target.value))}
                        />

                        <button 
                          type="button" 
                          className="icon-btn" 
                          style={{ width: 28, height: 28, color: 'var(--critical-red)' }}
                          onClick={() => removePoLine(idx)}
                          disabled={poItems.length <= 1}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">PO Notes / Special Instructions</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Festival buffer stock, morning delivery preferred"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreatePOModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Dispatch PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIVE GOODS & CREATE BATCHES */}
      {showReceiveModal && (
        <div className="modal-overlay" onClick={() => setShowReceiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="heading-3">Receive Goods & Create Batches</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Purchase Order: <strong>{showReceiveModal.poNumber}</strong> &bull; Supplier: {showReceiveModal.supplierName}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowReceiveModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleConfirmReceipt}>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Enter received quantities and assign batch numbers and expiry dates from packaging labels. This automatically updates inventory and Expiry Radar.
                </p>

                <div className="table-container">
                  <table className="data-table" style={{ fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty Received</th>
                        <th>Batch Code *</th>
                        <th>Expiry Date *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveLines.map((line, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{line.productName}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              style={{ height: 32, width: 70, fontSize: 12 }}
                              value={line.qty}
                              onChange={(e) => {
                                const copy = [...receiveLines];
                                copy[idx].qty = Number(e.target.value);
                                setReceiveLines(copy);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ height: 32, width: 110, fontSize: 12, fontFamily: 'monospace' }}
                              value={line.batchNumber}
                              required
                              onChange={(e) => {
                                const copy = [...receiveLines];
                                copy[idx].batchNumber = e.target.value;
                                setReceiveLines(copy);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control"
                              style={{ height: 32, fontSize: 12 }}
                              value={line.expiryDate}
                              required
                              onChange={(e) => {
                                const copy = [...receiveLines];
                                copy[idx].expiryDate = e.target.value;
                                setReceiveLines(copy);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReceiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-mint">
                  Confirm Receipt & Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
