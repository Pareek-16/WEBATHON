import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  IndianRupee, 
  Layers, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FestivalPlan, Product, Batch, PurchaseOrder, ShopkeeperProfile } from '../types';
import { storage } from '../services/storage';
import { audioAlerts } from '../services/audioAlerts';

interface FestivalPlannerViewProps {
  festivalPlans: FestivalPlan[];
  products: Product[];
  batches: Batch[];
  profile: ShopkeeperProfile;
  onNavigateToPOs: () => void;
}

export const FestivalPlannerView: React.FC<FestivalPlannerViewProps> = ({
  festivalPlans,
  products,
  batches,
  profile,
  onNavigateToPOs,
}) => {
  const [selectedFestival, setSelectedFestival] = useState<string>('Diwali');
  const [budgetLimit, setBudgetLimit] = useState<number>(45000);
  const [prepWeeks, setPrepWeeks] = useState<number>(3);

  const activeBatches = batches.filter(b => b.status === 'active' && b.currentQty > 0);

  // Festival presets
  const festivalPresets: Record<string, { multiplierGhee: number; multiplierSweets: number; multiplierStaples: number; defaultBudget: number; warning: string }> = {
    Diwali: {
      multiplierGhee: 2.4, // Oils & Ghee
      multiplierSweets: 3.5, // Chocolates & Sweets
      multiplierStaples: 1.8, // Atta, Maida, Dal
      defaultBudget: 45000,
      warning: 'Oil and confectionery distributors require orders 5 days ahead due to truck traffic restrictions.'
    },
    Holi: {
      multiplierGhee: 1.9,
      multiplierSweets: 2.2,
      multiplierStaples: 1.6,
      defaultBudget: 28000,
      warning: 'Order packaged snacks, juices, and mawa 3 days in advance.'
    },
    Eid: {
      multiplierGhee: 2.6,
      multiplierSweets: 2.8,
      multiplierStaples: 2.2,
      defaultBudget: 35000,
      warning: 'High demand for Basmati rice, vermicelli/sewaiyan, dry fruits, and milk.'
    },
    'Raksha Bandhan': {
      multiplierGhee: 1.5,
      multiplierSweets: 3.8, // Heavy chocolate & mithai gifting
      multiplierStaples: 1.2,
      defaultBudget: 30000,
      warning: 'Cadbury and Haldiram delivery rush starts 7 days prior.'
    },
    Navratri: {
      multiplierGhee: 2.1,
      multiplierSweets: 1.8,
      multiplierStaples: 2.5, // Kuttu atta, rock salt (Sendha namak), sabudana
      defaultBudget: 32000,
      warning: 'Sendha namak and special fasting flours see 4x surge in first 3 days.'
    },
    'Durga Puja': {
      multiplierGhee: 2.0,
      multiplierSweets: 2.8,
      multiplierStaples: 1.9,
      defaultBudget: 34000,
      warning: 'Bulk puja oil and mustard oil requirements.'
    },
    Christmas: {
      multiplierGhee: 1.3,
      multiplierSweets: 2.5,
      multiplierStaples: 1.2,
      defaultBudget: 22000,
      warning: 'Bakery ingredients and beverages demand increase.'
    }
  };

  const preset = festivalPresets[selectedFestival] || festivalPresets['Diwali'];

  // Plan item calculations based on actual active inventory
  const festiveItems = [
    {
      prodId: 'prod_fortune_oil',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
      category: 'Oils, Spices & Condiments',
      baselineDemand: 30,
      multiplier: preset.multiplierGhee,
      unitCost: 124,
      leadTimeDays: 2,
    },
    {
      prodId: 'prod_aashirvaad_atta',
      name: 'Aashirvaad Shudh Chakki Whole Wheat Atta 10kg',
      category: 'Rice, Wheat, Flour & Pulses',
      baselineDemand: 18,
      multiplier: preset.multiplierStaples,
      unitCost: 360,
      leadTimeDays: 2,
    },
    {
      prodId: 'prod_cadbury_silk',
      name: 'Cadbury Dairy Milk Silk Chocolate 150g',
      category: 'Packaged Snacks & Biscuits',
      baselineDemand: 14,
      multiplier: preset.multiplierSweets,
      unitCost: 145,
      leadTimeDays: 4,
    },
    {
      prodId: 'prod_tata_toor_dal',
      name: 'Tata Sampann Unpolished Toor Dal 1kg',
      category: 'Rice, Wheat, Flour & Pulses',
      baselineDemand: 22,
      multiplier: preset.multiplierStaples,
      unitCost: 148,
      leadTimeDays: 2,
    },
    {
      prodId: 'prod_amul_butter',
      name: 'Amul Pasteurised Salted Butter 500g',
      category: 'Dairy & Refrigerated',
      baselineDemand: 16,
      multiplier: preset.multiplierGhee,
      unitCost: 236,
      leadTimeDays: 1,
    },
  ].map(item => {
    const prodBatches = activeBatches.filter(b => b.productId === item.prodId);
    const currentStock = prodBatches.reduce((a, b) => a + b.currentQty, 0);
    const forecastDemand = Math.round(item.baselineDemand * item.multiplier);
    const gap = Math.max(0, forecastDemand - currentStock);
    const estimatedCost = gap * item.unitCost;

    return {
      ...item,
      currentStock,
      forecastDemand,
      suggestedReorderQty: gap,
      estimatedCost,
    };
  });

  const totalEstimatedCost = festiveItems.reduce((acc, item) => acc + item.estimatedCost, 0);
  const budgetUtilizationPct = Math.min(100, Math.round((totalEstimatedCost / budgetLimit) * 100));

  const handleGeneratePOFromFestival = () => {
    const poItems = festiveItems.filter(i => i.suggestedReorderQty > 0).map(i => ({
      productId: i.prodId,
      productName: i.name,
      quantity: i.suggestedReorderQty,
      unit: 'pack',
      unitCost: i.unitCost,
      totalCost: i.estimatedCost,
      receivedQty: 0,
    }));

    const newPO: PurchaseOrder = {
      id: 'po_festive_' + Date.now(),
      poNumber: `PO-${selectedFestival.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      supplierId: 'sup_mandi_spices',
      supplierName: 'Khari Baoli Grain & Spice Mandi Traders',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'ordered',
      totalAmount: totalEstimatedCost,
      items: poItems,
      notes: `Automated ${selectedFestival} Festive Buffer replenishment (${prepWeeks} weeks prep).`,
    };

    storage.savePurchaseOrder(newPO);
    audioAlerts.playSuccessTone();
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    alert(`Purchase Order ${newPO.poNumber} for ₹${totalEstimatedCost.toLocaleString('en-IN')} has been generated! Check Purchase Orders.`);
    onNavigateToPOs();
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Festival Demand Planner</h1>
            <span className="badge badge-mint" style={{ fontSize: 12 }}>Seasonal Predictive AI</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Prepare early for Indian festive rushes. Calculate category surges, stock gaps, and lead-time cushions.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleGeneratePOFromFestival}>
          <Plus size={16} />
          <span>Generate Festival PO (₹{totalEstimatedCost.toLocaleString('en-IN')})</span>
        </button>
      </div>

      {/* Festival Selector Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
            {['Diwali', 'Holi', 'Eid', 'Raksha Bandhan', 'Navratri', 'Durga Puja', 'Christmas'].map(fest => (
              <button
                key={fest}
                className={`btn btn-sm ${selectedFestival === fest ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', fontWeight: selectedFestival === fest ? 700 : 500 }}
                onClick={() => {
                  setSelectedFestival(fest);
                  setBudgetLimit(festivalPresets[fest].defaultBudget);
                }}
              >
                {fest}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Budget:</span>
              <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--forest-green)' }}>
                <span>₹</span>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: 90, height: 32, fontSize: 13, padding: '0 6px' }}
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Prep Window:</span>
              <select
                className="form-control"
                style={{ width: 100, height: 32, fontSize: 12.5 }}
                value={prepWeeks}
                onChange={(e) => setPrepWeeks(Number(e.target.value))}
              >
                <option value={2}>2 Weeks</option>
                <option value={3}>3 Weeks</option>
                <option value={4}>4 Weeks</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Lead Time Warning Banner */}
      <div style={{
        background: '#FEF8ED',
        border: '1px solid #FCDCA0',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
        color: '#7D5204'
      }}>
        <AlertTriangle size={18} color="var(--warning-amber)" style={{ flexShrink: 0 }} />
        <div>
          <strong>{selectedFestival} Supplier Lead Time Advisory:</strong> {preset.warning}
        </div>
      </div>

      {/* Budget & Gap Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Target Purchasing Budget</div>
          <div className="text-metric" style={{ fontSize: 24, marginTop: 4 }}>
            ₹{budgetLimit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Planned capital allocation
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--forest-green)', fontWeight: 600 }}>Estimated Purchasing Cost</div>
          <div className="text-metric" style={{ fontSize: 24, marginTop: 4, color: 'var(--forest-green)' }}>
            ₹{totalEstimatedCost.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {budgetUtilizationPct}% of allocated budget utilized
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Buffer Units Needed</div>
          <div className="text-metric" style={{ fontSize: 24, marginTop: 4 }}>
            {festiveItems.reduce((a, b) => a + b.suggestedReorderQty, 0)} <span style={{ fontSize: 13, fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Across 5 key festival categories
          </div>
        </div>
      </div>

      {/* Demand Forecast & Reorder Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Festive Item</th>
              <th>Category</th>
              <th>Baseline Demand</th>
              <th>Surge Multiplier</th>
              <th>Forecast Demand</th>
              <th>Current Stock</th>
              <th>Gap (Reorder Qty)</th>
              <th>Unit Cost (₹)</th>
              <th style={{ textAlign: 'right' }}>Estimated PO Cost</th>
            </tr>
          </thead>
          <tbody>
            {festiveItems.map((item, idx) => {
              return (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Lead time: {item.leadTimeDays} days
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                      {item.category}
                    </span>
                  </td>
                  <td>{item.baselineDemand} units</td>
                  <td>
                    <span className="badge badge-mint" style={{ fontWeight: 700 }}>
                      {item.multiplier}x (+{Math.round((item.multiplier - 1) * 100)}%)
                    </span>
                  </td>
                  <td>
                    <strong>{item.forecastDemand} units</strong>
                  </td>
                  <td>
                    <span className={`badge ${item.currentStock < item.forecastDemand ? 'badge-warning' : 'badge-normal'}`}>
                      {item.currentStock} units
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 14, fontWeight: 700, color: item.suggestedReorderQty > 0 ? 'var(--critical-red)' : 'var(--forest-green)' }}>
                      +{item.suggestedReorderQty} units
                    </span>
                  </td>
                  <td>₹{item.unitCost}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                    ₹{item.estimatedCost.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
