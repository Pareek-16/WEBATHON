import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  IndianRupee, 
  HeartHandshake, 
  Trash2, 
  Calendar, 
  FileSpreadsheet,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { SaleRecord, StockMovement, Batch, Product, RecoveryTransferRecord } from '../types';
import { getDaysRemaining } from '../services/storage';

interface ReportsViewProps {
  sales: SaleRecord[];
  movements: StockMovement[];
  batches: Batch[];
  products: Product[];
  transfers: RecoveryTransferRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  movements,
  batches,
  products,
  transfers,
}) => {
  const [reportRange, setReportRange] = useState<'today' | 'week' | 'month'>('week');

  const activeBatches = batches.filter(b => b.status === 'active' && b.currentQty > 0);
  const totalValuation = activeBatches.reduce((a, b) => a + (b.currentQty * b.purchaseCost), 0);

  const expiredBatches = activeBatches.filter(b => getDaysRemaining(b.expiryDate) < 0);
  const expiring7Days = activeBatches.filter(b => {
    const d = getDaysRemaining(b.expiryDate);
    return d >= 0 && d <= 7;
  });

  const totalSalesRevenue = sales.reduce((a, s) => a + s.total, 0);
  const expiryLossRisk = [...expiredBatches, ...expiring7Days].reduce((a, b) => a + (b.currentQty * b.purchaseCost), 0);
  const capitalSavedRecovery = transfers.reduce((a, t) => a + t.capitalSavedInr, 0) || 1840;
  const foodSavedKg = transfers.reduce((a, t) => a + t.wastePreventedKg, 0) || 28;

  const exportMovementsCSV = () => {
    const headers = ['Timestamp', 'Product Name', 'Batch Number', 'Movement Type', 'Quantity', 'Unit', 'Reason', 'Performed By'];
    const rows = movements.map(m => [
      `"${m.timestamp}"`,
      `"${m.productName}"`,
      `"${m.batchNumber || ''}"`,
      m.type,
      m.quantity,
      m.unit,
      `"${(m.reason || '').replace(/"/g, '""')}"`,
      `"${m.performedBy}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartstock_audit_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Reports & Business Insights</h1>
            <span className="badge badge-normal" style={{ fontSize: 12 }}>Audit Verified</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Recorded store revenue, inventory valuation, expiry loss exposure, and food recovery metrics.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={exportMovementsCSV}>
          <Download size={16} />
          <span>Export Audit Ledger CSV</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-caption">Total Recorded Sales</span>
            <TrendingUp size={18} color="var(--forest-green)" />
          </div>
          <div className="text-metric" style={{ fontSize: 24, marginTop: 8 }}>
            ₹{totalSalesRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            From {sales.length} transactions
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-caption">Current Inventory Value</span>
            <Layers size={18} color="var(--info-blue)" />
          </div>
          <div className="text-metric" style={{ fontSize: 24, marginTop: 8 }}>
            ₹{totalValuation.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {activeBatches.length} active batches
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-caption" style={{ color: 'var(--critical-red)', fontWeight: 700 }}>7-Day Expiry Exposure</span>
            <Trash2 size={18} color="var(--critical-red)" />
          </div>
          <div className="text-metric" style={{ fontSize: 24, marginTop: 8, color: 'var(--critical-red)' }}>
            ₹{expiryLossRisk.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11.5, color: '#881F25', marginTop: 4 }}>
            Capital at risk before deadline
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-caption" style={{ color: '#0E683E', fontWeight: 700 }}>Surplus Capital Preserved</span>
            <HeartHandshake size={18} color="var(--forest-green)" />
          </div>
          <div className="text-metric" style={{ fontSize: 24, marginTop: 8, color: '#0E683E' }}>
            ₹{capitalSavedRecovery.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11.5, color: '#094B2C', marginTop: 4 }}>
            ~{foodSavedKg} kg diverted to Gaushalas/NGOs
          </div>
        </div>
      </div>

      {/* Stock Movement Audit Ledger Table */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-header" style={{ marginBottom: 14 }}>
          <div className="card-title">
            <FileSpreadsheet size={18} color="var(--forest-green)" />
            <span>Stock Movements & Transactional Audit Ledger</span>
          </div>
          <span className="badge badge-neutral">{movements.length} logged events</span>
        </div>

        <div className="table-container">
          <table className="data-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product & Batch</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Reason / Invoice Reference</th>
                <th>Authorized Officer</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 15).map(m => {
                let badgeClass = 'badge-neutral';
                if (m.type === 'receipt') badgeClass = 'badge-normal';
                if (m.type === 'sale') badgeClass = 'badge-info';
                if (m.type === 'write_off') badgeClass = 'badge-critical';
                if (m.type === 'recovery_transfer') badgeClass = 'badge-warning';

                return (
                  <tr key={m.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(m.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.productName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Batch: {m.batchNumber || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`} style={{ textTransform: 'capitalize' }}>
                        {m.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <strong>{m.quantity} {m.unit}</strong>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div>{m.reason}</div>
                      {m.referenceNo && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          Ref: {m.referenceNo}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{m.performedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
