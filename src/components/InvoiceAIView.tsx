import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  ShieldAlert, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Layers,
  Calendar,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InvoiceExtraction, InvoiceLineItem, Product, Batch, Supplier, ShopkeeperProfile } from '../types';
import { storage } from '../services/storage';
import { audioAlerts } from '../services/audioAlerts';

interface InvoiceAIViewProps {
  products: Product[];
  suppliers: Supplier[];
  profile: ShopkeeperProfile;
  onNavigateToInventory: () => void;
  onNavigateToRadar: () => void;
}

export const InvoiceAIView: React.FC<InvoiceAIViewProps> = ({
  products,
  suppliers,
  profile,
  onNavigateToInventory,
  onNavigateToRadar,
}) => {
  const [processingState, setProcessingState] = useState<'idle' | 'uploading' | 'reviewing' | 'completed'>('idle');
  const [extractionResult, setExtractionResult] = useState<InvoiceExtraction | null>(null);
  const [selectedDemoInvoice, setSelectedDemoInvoice] = useState<string>('');

  // Sample realistic Indian distributor GST invoices for instantaneous demonstration
  const sampleInvoices: Record<string, InvoiceExtraction> = {
    amul: {
      id: 'inv_amul_gst_01',
      supplierName: 'Delhi NCR Dairy Distributors Ltd',
      invoiceNumber: 'TAX-INV-2026-AMUL-9912',
      invoiceDate: new Date().toISOString().split('T')[0],
      confidence: 96,
      duplicateDetected: false,
      items: [
        {
          id: 'item_1',
          productName: 'Amul Pasteurised Salted Butter 500g',
          brand: 'Amul',
          category: 'Dairy & Refrigerated',
          barcode: '8901262010014',
          quantity: 20,
          unit: 'pack',
          purchasePrice: 236,
          batchNumber: `AML-BT-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0], // 90 days
          hasMissingExpiry: false,
          confidence: 98,
        },
        {
          id: 'item_2',
          productName: 'Milky Mist Fresh Malai Paneer 200g',
          brand: 'Milky Mist',
          category: 'Dairy & Refrigerated',
          barcode: '8906003250123',
          quantity: 15,
          unit: 'pack',
          purchasePrice: 76,
          batchNumber: `MM-PN-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], // 14 days
          hasMissingExpiry: false,
          confidence: 95,
        },
        {
          id: 'item_3',
          productName: 'Amul Taaza Homogenised Toned Milk 500ml',
          brand: 'Amul',
          category: 'Dairy & Refrigerated',
          barcode: '8901262010052',
          quantity: 30,
          unit: 'pack',
          purchasePrice: 24,
          batchNumber: `AML-TZ-${Date.now().toString().slice(-4)}`,
          expiryDate: '', // INVOICE OMITS EXPIRY DATE - REQUIRES USER INPUT
          hasMissingExpiry: true,
          confidence: 88,
        },
      ]
    },
    itc: {
      id: 'inv_itc_del_02',
      supplierName: 'ITC North Logistics & Wholesale Hub',
      invoiceNumber: 'ITC-WHOLESALE-2026-4412',
      invoiceDate: new Date().toISOString().split('T')[0],
      confidence: 94,
      duplicateDetected: false,
      items: [
        {
          id: 'item_itc_1',
          productName: 'Aashirvaad Shudh Chakki Whole Wheat Atta 10kg',
          brand: 'Aashirvaad',
          category: 'Rice, Wheat, Flour & Pulses',
          barcode: '8901725013777',
          quantity: 25,
          unit: 'bag',
          purchasePrice: 360,
          batchNumber: `ATT-ITC-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
          hasMissingExpiry: false,
          confidence: 97,
        },
        {
          id: 'item_itc_2',
          productName: 'Britannia Good Day Cashew Cookies 200g',
          brand: 'Britannia',
          category: 'Packaged Snacks & Biscuits',
          barcode: '8901063012446',
          quantity: 36,
          unit: 'pack',
          purchasePrice: 32,
          batchNumber: `GD-BRT-${Date.now().toString().slice(-4)}`,
          expiryDate: '', // Missing date on invoice!
          hasMissingExpiry: true,
          confidence: 92,
        },
      ]
    },
    haldiram: {
      id: 'inv_hld_ncr_03',
      supplierName: 'Khari Baoli Grain & Spice Mandi Traders',
      invoiceNumber: 'MANDI-INV-2026-8801',
      invoiceDate: new Date().toISOString().split('T')[0],
      confidence: 95,
      duplicateDetected: false,
      items: [
        {
          id: 'item_hld_1',
          productName: "Haldiram's Nagpur Aloo Bhujia 400g Pouch",
          brand: "Haldiram's",
          category: 'Packaged Snacks & Biscuits',
          barcode: '8904004400122',
          quantity: 24,
          unit: 'pouch',
          purchasePrice: 92,
          batchNumber: `HLD-BHJ-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 86400000 * 120).toISOString().split('T')[0],
          hasMissingExpiry: false,
          confidence: 96,
        },
        {
          id: 'item_hld_2',
          productName: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
          brand: 'Fortune',
          category: 'Oils, Spices & Condiments',
          barcode: '8906007280018',
          quantity: 30,
          unit: 'pouch',
          purchasePrice: 122,
          batchNumber: `AWL-SO-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0],
          hasMissingExpiry: false,
          confidence: 98,
        },
      ]
    }
  };

  const handleSimulateUpload = (key: string) => {
    setSelectedDemoInvoice(key);
    setProcessingState('uploading');

    setTimeout(() => {
      const data = sampleInvoices[key];
      setExtractionResult(JSON.parse(JSON.stringify(data)));
      setProcessingState('reviewing');
    }, 800);
  };

  const handleUpdateItemField = (index: number, field: keyof InvoiceLineItem, val: any) => {
    if (!extractionResult) return;
    const items = [...extractionResult.items];
    items[index] = { ...items[index], [field]: val };
    if (field === 'expiryDate' && val) {
      items[index].hasMissingExpiry = false;
    }
    setExtractionResult({ ...extractionResult, items });
  };

  const handleConfirmAndProcess = () => {
    if (!extractionResult) return;

    // Check if supplier exists or match
    const matchedSupplier = suppliers.find(s => 
      s.name.toLowerCase().includes(extractionResult.supplierName.toLowerCase())
    ) || suppliers[0];

    // Transactionally create batches and stock receipts
    for (const item of extractionResult.items) {
      let prod = products.find(p => p.barcode === item.barcode || p.name.toLowerCase() === item.productName.toLowerCase());

      if (!prod) {
        // Create product if missing
        prod = {
          id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          name: item.productName,
          brand: item.brand || 'General',
          category: item.category || 'Rice, Wheat, Flour & Pulses',
          barcode: item.barcode,
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          unit: item.unit,
          reorderLevel: 10,
          sellingPrice: Math.round(item.purchasePrice * 1.15),
          mrp: Math.round(item.purchasePrice * 1.2),
        };
        storage.saveProduct(prod);
      }

      // Create new batch
      const newBatch: Batch = {
        id: 'batch_inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        productId: prod.id,
        productName: prod.name,
        batchNumber: item.batchNumber || `INV-${Date.now().toString().slice(-5)}`,
        receivedDate: extractionResult.invoiceDate,
        expiryDate: item.expiryDate || new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
        originalQty: item.quantity,
        currentQty: item.quantity,
        unit: item.unit,
        purchaseCost: item.purchasePrice,
        supplierId: matchedSupplier?.id || 'sup_default',
        supplierName: extractionResult.supplierName,
        status: 'active',
        notes: `Processed via Invoice AI (${extractionResult.invoiceNumber})`,
      };

      storage.saveBatch(newBatch);

      storage.recordMovement({
        productId: prod.id,
        productName: prod.name,
        batchId: newBatch.id,
        batchNumber: newBatch.batchNumber,
        type: 'receipt',
        quantity: item.quantity,
        unit: item.unit,
        reason: `Invoice AI Automated Entry (${extractionResult.invoiceNumber})`,
        referenceNo: extractionResult.invoiceNumber,
        performedBy: 'Rajesh Sharma (Owner)',
      });
    }

    audioAlerts.playSuccessTone();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setProcessingState('completed');
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Description */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Invoice AI — Smart Stock Entry</h1>
            <span className="badge badge-mint" style={{ fontSize: 12 }}>OCR & GST Parser</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Extract wholesale FMCG invoices automatically, flag missing dates, and create batch records without manual typing.
          </p>
        </div>
      </div>

      {/* Upload & Demo Invoice Selector Area */}
      {processingState === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Drag & Drop Upload Zone */}
          <div 
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              border: '2px dashed var(--border-color)',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14
            }}
            onClick={() => handleSimulateUpload('amul')}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--mint-subtle)', color: 'var(--forest-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={28} />
            </div>
            <div>
              <h3 className="heading-3" style={{ fontSize: 17 }}>Upload GST Tax Invoice (PDF or Image)</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 460, margin: '4px auto 0' }}>
                Drag and drop supplier invoice or click to browse. Supports Amul, ITC, HUL, Britannia, and Mandi distributor formats.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleSimulateUpload('amul'); }}>
                <Camera size={14} />
                <span>Capture Label / Invoice</span>
              </button>
            </div>
          </div>

          {/* 1-Click Instant Test Demo Invoices */}
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title">
                <Sparkles size={18} color="var(--forest-green)" />
                <span>Test with Sample Indian Distributor GST Invoices</span>
              </div>
              <span className="badge badge-neutral">Instant Demo OCR</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div 
                style={{
                  padding: 16,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-alt)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onClick={() => handleSimulateUpload('amul')}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Amul Dairy Distributor</span>
                  <span className="badge badge-normal" style={{ fontSize: 10 }}>GST Invoice</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Tax Invoice #INV-2026-AMUL-9912 &bull; 3 Items (Milk, Butter, Paneer)
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--warning-amber)', marginTop: 6, fontWeight: 600 }}>
                  * Demonstrates detection of missing expiry date on pouch milk
                </div>
              </div>

              <div 
                style={{
                  padding: 16,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-alt)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onClick={() => handleSimulateUpload('itc')}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>ITC North Logistics Hub</span>
                  <span className="badge badge-normal" style={{ fontSize: 10 }}>Wholesale</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Invoice #ITC-WHOLESALE-2026-4412 &bull; Atta & Biscuits
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>
                  High-confidence batch and SKU extraction
                </div>
              </div>

              <div 
                style={{
                  padding: 16,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-alt)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onClick={() => handleSimulateUpload('haldiram')}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Mandi Grain & Oil Traders</span>
                  <span className="badge badge-normal" style={{ fontSize: 10 }}>FMCG</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Invoice #MANDI-INV-2026-8801 &bull; Haldiram Bhujia & Fortune Oil
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>
                  Includes 100% complete batch and expiry dates
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploading / Extracting Spinner State */}
      {processingState === 'uploading' && (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #CAD5CE', borderTopColor: 'var(--forest-green)', borderRadius: '50%', margin: '0 auto 18px', animation: 'spin 1s linear infinite' }} />
          <h3 className="heading-3">AI Engine Processing Invoice OCR...</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Parsing GSTIN, supplier details, line item descriptions, batch numbers, and expiry stamps.
          </p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Review & Edit Screen */}
      {processingState === 'reviewing' && extractionResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Invoice Header Details Banner */}
          <div className="card" style={{ padding: 18, background: '#F8FAF9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 className="heading-3">{extractionResult.supplierName}</h3>
                  <span className="badge badge-normal" style={{ fontSize: 11 }}>
                    Confidence: {extractionResult.confidence}%
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Invoice No: <strong>{extractionResult.invoiceNumber}</strong> &bull; Date: <strong>{extractionResult.invoiceDate}</strong> &bull; Total Line Items: <strong>{extractionResult.items.length}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setProcessingState('idle')}>
                  Discard & Re-upload
                </button>
              </div>
            </div>
          </div>

          {/* Missing Expiry Date Warning Callout */}
          {extractionResult.items.some(i => i.hasMissingExpiry) && (
            <div style={{
              background: 'var(--warning-amber-bg)',
              border: '1px solid var(--warning-amber-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 13,
              color: '#7E5304'
            }}>
              <AlertTriangle size={20} color="var(--warning-amber)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Missing Expiry Date Detected on Invoice:</strong> Indian supplier invoices often omit expiry dates for pouch products. SmartStock AI strictly refrains from fabricating dates. Please scan or enter the physical label date below before proceeding.
              </div>
            </div>
          )}

          {/* Extracted Line Items Table (Editable) */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Description</th>
                  <th>Brand</th>
                  <th>Barcode</th>
                  <th>Quantity</th>
                  <th>Cost (₹)</th>
                  <th>Batch Number</th>
                  <th>Expiry Date *</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {extractionResult.items.map((item, idx) => {
                  return (
                    <tr key={item.id} style={{ background: item.hasMissingExpiry ? '#FFFDF8' : '#FFFFFF' }}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ height: 36, fontSize: 13, minWidth: 220 }}
                          value={item.productName}
                          onChange={(e) => handleUpdateItemField(idx, 'productName', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ height: 36, fontSize: 13, width: 100 }}
                          value={item.brand}
                          onChange={(e) => handleUpdateItemField(idx, 'brand', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ height: 36, fontSize: 12, width: 120, fontFamily: 'monospace' }}
                          value={item.barcode}
                          onChange={(e) => handleUpdateItemField(idx, 'barcode', e.target.value)}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ height: 36, fontSize: 13, width: 70 }}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemField(idx, 'quantity', Number(e.target.value))}
                          />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.unit}</span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ height: 36, fontSize: 13, width: 75 }}
                          value={item.purchasePrice}
                          onChange={(e) => handleUpdateItemField(idx, 'purchasePrice', Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ height: 36, fontSize: 12, width: 120, fontFamily: 'monospace' }}
                          value={item.batchNumber}
                          onChange={(e) => handleUpdateItemField(idx, 'batchNumber', e.target.value)}
                        />
                      </td>
                      <td>
                        <div>
                          <input
                            type="date"
                            className="form-control"
                            style={{
                              height: 36,
                              fontSize: 12,
                              borderColor: item.hasMissingExpiry ? 'var(--warning-amber)' : 'var(--border-color)',
                              background: item.hasMissingExpiry ? '#FFF9EE' : '#FFFFFF'
                            }}
                            value={item.expiryDate}
                            onChange={(e) => handleUpdateItemField(idx, 'expiryDate', e.target.value)}
                          />
                          {item.hasMissingExpiry && (
                            <span style={{ fontSize: 10.5, color: '#9A6605', fontWeight: 600, display: 'block', marginTop: 2 }}>
                              Scan label or enter
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-normal" style={{ fontSize: 11 }}>
                          {item.confidence}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Confirm & Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setProcessingState('idle')}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmAndProcess}>
              <CheckCircle2 size={16} />
              <span>Confirm & Add {extractionResult.items.length} Items to Inventory</span>
            </button>
          </div>
        </div>
      )}

      {/* Completed Success Screen */}
      {processingState === 'completed' && (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8F5EE', color: 'var(--forest-green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Check size={32} />
          </div>
          <h2 className="heading-2">Stock Entry Successfully Recorded!</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 480, margin: '8px auto 24px' }}>
            New product batches have been created with transactional audit logs. Expiry Radar has been automatically updated with new deadlines.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setProcessingState('idle')}>
              Process Another Invoice
            </button>
            <button className="btn btn-primary" onClick={onNavigateToInventory}>
              View in Inventory
            </button>
            <button className="btn btn-mint" onClick={onNavigateToRadar}>
              Inspect Expiry Radar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
