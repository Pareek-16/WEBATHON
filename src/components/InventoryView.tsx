import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Layers, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  SlidersHorizontal,
  Clock,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { Product, Batch, Supplier, StockMovement } from '../types';
import { storage, getDaysRemaining, getExpiryStatus } from '../services/storage';

interface InventoryViewProps {
  products: Product[];
  batches: Batch[];
  suppliers: Supplier[];
  initialFilter?: string;
  onNavigateToRadar: (batchId?: string) => void;
  onNavigateToRecovery: (batchId?: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  batches,
  suppliers,
  initialFilter,
  onNavigateToRadar,
  onNavigateToRecovery,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>(initialFilter || 'All');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState<Product | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState<{ product: Product; batch: Batch } | null>(null);

  // Form states for Add Product
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Rice, Wheat, Flour & Pulses');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('pack');
  const [newProdReorder, setNewProdReorder] = useState(15);
  const [newProdPrice, setNewProdPrice] = useState(50);
  const [newProdMrp, setNewProdMrp] = useState(55);

  // Form states for Add Batch
  const [batchNo, setBatchNo] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchQty, setBatchQty] = useState(20);
  const [batchCost, setBatchCost] = useState(40);
  const [batchSupplier, setBatchSupplier] = useState(suppliers[0]?.id || '');

  // Form states for Adjust Stock
  const [adjDelta, setAdjDelta] = useState(1);
  const [adjType, setAdjType] = useState<StockMovement['type']>('adjustment');
  const [adjReason, setAdjReason] = useState('Physical count discrepancy correction');

  const categories = [
    'All',
    'Dairy & Refrigerated',
    'Bread & Bakery',
    'Rice, Wheat, Flour & Pulses',
    'Oils, Spices & Condiments',
    'Packaged Snacks & Biscuits',
    'Packaged Beverages & Health Drinks',
    'Canned & Packaged Foods',
    'Health & Nutrition',
    'Household Essentials',
  ];

  // Filtering products
  const filteredProducts = products.filter(p => {
    const totalStock = (p.batches || []).reduce((acc, b) => acc + b.currentQty, 0);
    const isLow = totalStock <= p.reorderLevel;

    // Search query match
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q);

    // Category match
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    // Status filter match
    let matchesStatus = true;
    if (stockStatusFilter === 'low_stock') {
      matchesStatus = isLow;
    } else if (stockStatusFilter === 'in_stock') {
      matchesStatus = totalStock > 0;
    } else if (stockStatusFilter === 'out_of_stock') {
      matchesStatus = totalStock === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newProduct: Product = {
      id: 'prod_' + Date.now(),
      name: newProdName.trim(),
      brand: newProdBrand.trim() || 'General',
      category: newProdCategory,
      barcode: newProdBarcode.trim() || `${Date.now()}`.slice(-13),
      sku: newProdSku.trim() || `SKU-${Date.now()}`.slice(-7),
      unit: newProdUnit,
      reorderLevel: Number(newProdReorder) || 10,
      sellingPrice: Number(newProdPrice) || 0,
      mrp: Number(newProdMrp) || Number(newProdPrice) || 0,
    };

    storage.saveProduct(newProduct);
    setShowAddProductModal(false);
    // Reset form
    setNewProdName('');
    setNewProdBrand('');
    setNewProdBarcode('');
    setNewProdSku('');
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddBatchModal || !batchExpiry) return;

    const sup = suppliers.find(s => s.id === batchSupplier) || suppliers[0];

    const newBatch: Batch = {
      id: 'batch_' + Date.now(),
      productId: showAddBatchModal.id,
      productName: showAddBatchModal.name,
      batchNumber: batchNo.trim() || `B-${Date.now().toString().slice(-5)}`,
      receivedDate: new Date().toISOString().split('T')[0],
      expiryDate: batchExpiry,
      originalQty: Number(batchQty) || 1,
      currentQty: Number(batchQty) || 1,
      unit: showAddBatchModal.unit,
      purchaseCost: Number(batchCost) || 0,
      supplierId: sup?.id || 'sup_general',
      supplierName: sup?.name || 'Local Distributor',
      status: 'active',
    };

    storage.saveBatch(newBatch);
    storage.recordMovement({
      productId: showAddBatchModal.id,
      productName: showAddBatchModal.name,
      batchId: newBatch.id,
      batchNumber: newBatch.batchNumber,
      type: 'receipt',
      quantity: newBatch.currentQty,
      unit: newBatch.unit,
      reason: `Direct batch receipt: ${newBatch.batchNumber}`,
      performedBy: 'Rajesh Sharma (Owner)',
    });

    setShowAddBatchModal(null);
    setBatchNo('');
    setBatchExpiry('');
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustModal) return;

    const delta = adjType === 'receipt' ? Math.abs(adjDelta) : -Math.abs(adjDelta);
    storage.adjustBatchQty(
      showAdjustModal.batch.id,
      delta,
      adjType,
      adjReason || 'Manual inventory adjustment'
    );

    setShowAdjustModal(null);
  };

  const exportInventoryCSV = () => {
    const headers = ['Product Name', 'Brand', 'Category', 'Barcode', 'SKU', 'Available Stock', 'Unit', 'Reorder Level', 'Selling Price (INR)', 'MRP (INR)'];
    const rows = products.map(p => {
      const stock = (p.batches || []).reduce((a, b) => a + b.currentQty, 0);
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand}"`,
        `"${p.category}"`,
        `'${p.barcode}`,
        `"${p.sku}"`,
        stock,
        p.unit,
        p.reorderLevel,
        p.sellingPrice,
        p.mrp
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartstock_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 className="heading-1">Inventory Management</h1>
          <p style={{ marginTop: 4 }}>
            Monitor product catalogues, multi-batch records, and FEFO priorities.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportInventoryCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddProductModal(true)}>
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Universal Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 36, height: 40 }}
              placeholder="Filter by name, brand, barcode, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Stock Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-alt)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {['All', 'in_stock', 'low_stock'].map((status) => (
              <button
                key={status}
                className={`btn btn-xs ${stockStatusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', background: stockStatusFilter === status ? 'var(--brand-purple)' : 'transparent', textTransform: 'capitalize' }}
                onClick={() => setStockStatusFilter(status)}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs Scrollable */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingTop: 14,
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 14
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-xs ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                whiteSpace: 'nowrap',
                fontWeight: selectedCategory === cat ? 700 : 500
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Barcode & SKU</th>
              <th>Available Qty</th>
              <th>Active Batches</th>
              <th>Nearest Expiry</th>
              <th>Price (₹)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
                  No products match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map(prod => {
                const isExpanded = expandedProductId === prod.id;
                const prodBatches = prod.batches || [];
                const totalStock = prodBatches.reduce((acc, b) => acc + b.currentQty, 0);
                const isLow = totalStock <= prod.reorderLevel;

                // Sort batches by expiry date (FEFO: First Expired, First Out)
                const sortedBatches = [...prodBatches].sort((a, b) => 
                  new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                );
                const nearestBatch = sortedBatches[0];
                const daysRemaining = nearestBatch ? getDaysRemaining(nearestBatch.expiryDate) : null;

                return (
                  <React.Fragment key={prod.id}>
                    <tr>
                      <td>
                        <button
                          className="icon-btn"
                          style={{ width: 28, height: 28, border: 'none' }}
                          onClick={() => setExpandedProductId(isExpanded ? null : prod.id)}
                          title="View Batches"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{prod.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Brand: <strong>{prod.brand}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: 11.5 }}>
                          {prod.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{prod.barcode}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{prod.sku}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{totalStock}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{prod.unit}</span>
                          {isLow && (
                            <span className="badge badge-warning" style={{ fontSize: 10, padding: '1px 6px' }}>
                              Low
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Reorder: {prod.reorderLevel} {prod.unit}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: 11.5 }}>
                          {prodBatches.length} batch{prodBatches.length !== 1 ? 'es' : ''}
                        </span>
                      </td>
                      <td>
                        {nearestBatch ? (
                          <div>
                            <span className={`badge ${daysRemaining! <= 0 ? 'badge-critical' : (daysRemaining! <= 7 ? 'badge-warning' : 'badge-normal')}`}>
                              {daysRemaining! < 0 ? `Expired ${Math.abs(daysRemaining!)}d ago` : (daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`)}
                            </span>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {nearestBatch.batchNumber}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No batches</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>₹{prod.sellingPrice}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>MRP: ₹{prod.mrp}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => setShowAddBatchModal(prod)}
                            title="Receive new batch for this product"
                          >
                            <Plus size={13} />
                            <span>Add Batch</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Batches Sub-Table (FEFO tracking) */}
                    {isExpanded && (
                      <tr style={{ background: 'var(--surface-alt)' }}>
                        <td colSpan={9} style={{ padding: '14px 24px 20px 48px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand-purple)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Layers size={14} />
                              <span>INDIVIDUAL BATCH RECORDS (SORTED BY FEFO — FIRST EXPIRED, FIRST OUT)</span>
                            </div>
                            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                              FSSAI Compliance: Sell nearest expiry batches first
                            </span>
                          </div>

                          {prodBatches.length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '12px 0' }}>
                              No active batches found. Click "Add Batch" to receive stock.
                            </div>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, background: 'var(--surface-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                              <thead>
                                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                                  <th style={{ padding: '10px 12px' }}>FEFO Priority</th>
                                  <th style={{ padding: '10px 12px' }}>Batch Number</th>
                                  <th style={{ padding: '10px 12px' }}>Received</th>
                                  <th style={{ padding: '10px 12px' }}>Expiry Date</th>
                                  <th style={{ padding: '10px 12px' }}>Remaining Qty</th>
                                  <th style={{ padding: '10px 12px' }}>Cost (₹)</th>
                                  <th style={{ padding: '10px 12px' }}>Supplier</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedBatches.map((b, idx) => {
                                  const days = getDaysRemaining(b.expiryDate);
                                  const status = getExpiryStatus(b);
                                  const isExpired = days < 0;

                                  return (
                                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                      <td style={{ padding: '10px 12px' }}>
                                        <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                                          #{idx + 1} {idx === 0 ? '(Sell First)' : ''}
                                        </span>
                                      </td>
                                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                                        {b.batchNumber}
                                      </td>
                                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                        {b.receivedDate}
                                      </td>
                                      <td style={{ padding: '10px 12px' }}>
                                        <span className={`badge ${status === 'critical' ? 'badge-critical' : (status === 'warning' ? 'badge-warning' : 'badge-normal')}`}>
                                          {b.expiryDate} ({days < 0 ? `Expired ${Math.abs(days)}d ago` : (days === 0 ? 'Today' : `${days}d left`)})
                                        </span>
                                      </td>
                                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                                        {b.currentQty} {b.unit}
                                      </td>
                                      <td style={{ padding: '10px 12px' }}>
                                        ₹{b.purchaseCost}
                                      </td>
                                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                        {b.supplierName}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: 6 }}>
                                          <button
                                            className="btn btn-secondary btn-xs"
                                            onClick={() => setShowAdjustModal({ product: prod, batch: b })}
                                            title="Correct or adjust stock quantity"
                                          >
                                            Adjust
                                          </button>
                                          {days <= 7 && (
                                            <button
                                              className="btn btn-mint btn-xs"
                                              onClick={() => onNavigateToRecovery(b.id)}
                                              title="Match with Gaushala or NGO"
                                            >
                                              Food Recovery
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD PRODUCT */}
      {showAddProductModal && (
        <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="heading-3">Add Product to Catalogue</h3>
              <button className="icon-btn" onClick={() => setShowAddProductModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Aashirvaad Shudh Chakki Atta 10kg"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Aashirvaad / Amul"
                      value={newProdBrand}
                      onChange={(e) => setNewProdBrand(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Barcode / EAN</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="8901234567890"
                      value={newProdBarcode}
                      onChange={(e) => setNewProdBarcode(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit of Measure</label>
                    <select
                      className="form-control"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                    >
                      <option value="pack">Pack / Pouch</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="bag">Bag</option>
                      <option value="loaf">Loaf</option>
                      <option value="cup">Cup</option>
                      <option value="box">Box</option>
                      <option value="bottle">Bottle / Jar</option>
                      <option value="pcs">Pieces (pcs)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={newProdReorder}
                      onChange={(e) => setNewProdReorder(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MRP (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={newProdMrp}
                      onChange={(e) => setNewProdMrp(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BATCH */}
      {showAddBatchModal && (
        <div className="modal-overlay" onClick={() => setShowAddBatchModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="heading-3">Receive New Batch</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Product: <strong>{showAddBatchModal.name}</strong>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowAddBatchModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateBatch}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Batch / Lot Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. B-2026-881"
                      required
                      value={batchNo}
                      onChange={(e) => setBatchNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry / Best Before Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={batchExpiry}
                      onChange={(e) => setBatchExpiry(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Quantity ({showAddBatchModal.unit}) *</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      required
                      value={batchQty}
                      onChange={(e) => setBatchQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Cost Per Unit (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      required
                      value={batchCost}
                      onChange={(e) => setBatchCost(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <select
                    className="form-control"
                    value={batchSupplier}
                    onChange={(e) => setBatchSupplier(e.target.value)}
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBatchModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Receive & Log Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="heading-3">Stock Quantity Adjustment</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Batch {showAdjustModal.batch.batchNumber} &bull; Current Stock: <strong>{showAdjustModal.batch.currentQty} {showAdjustModal.batch.unit}</strong>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowAdjustModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Adjustment Type</label>
                  <select
                    className="form-control"
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as StockMovement['type'])}
                  >
                    <option value="adjustment">Stock Count Correction</option>
                    <option value="write_off">Wastage / Spoiled / Write-off</option>
                    <option value="receipt">Additional Stock Found</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity to Adjust ({showAdjustModal.batch.unit})</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max={adjType !== 'receipt' ? showAdjustModal.batch.currentQty : 500}
                    value={adjDelta}
                    onChange={(e) => setAdjDelta(Number(e.target.value))}
                  />
                  <div className="form-hint">
                    {adjType !== 'receipt' ? `Will deduct ${adjDelta} ${showAdjustModal.batch.unit} from current quantity.` : `Will add ${adjDelta} ${showAdjustModal.batch.unit} to current quantity.`}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Audited Reason for Adjustment *</label>
                  <textarea
                    className="form-control"
                    required
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Transactional Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
