import React, { useState } from 'react';
import { 
  Radar, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  HeartHandshake, 
  Trash2, 
  Sliders, 
  Filter, 
  Download, 
  Tag, 
  ArrowUpDown, 
  Calendar,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Batch, Product, ShopkeeperProfile } from '../types';
import { storage, getDaysRemaining, getExpiryStatus } from '../services/storage';

interface ExpiryRadarViewProps {
  batches: Batch[];
  products: Product[];
  profile: ShopkeeperProfile;
  initialFilter?: string;
  onNavigateToRecovery: (batchId: string) => void;
  onNavigateToSales: (batchId: string) => void;
}

export const ExpiryRadarView: React.FC<ExpiryRadarViewProps> = ({
  batches,
  products,
  profile,
  initialFilter,
  onNavigateToRecovery,
  onNavigateToSales,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter || 'all');
  const [warningThreshold, setWarningThreshold] = useState<number>(profile.warningThresholdDays || 7);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'days' | 'qty' | 'cost'>('days');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter only active batches with remaining stock
  const activeBatches = batches.filter(b => b.status === 'active' && b.currentQty > 0);

  // Group into the three-stage classification
  const redBatches = activeBatches.filter(b => getDaysRemaining(b.expiryDate) <= 0);
  const yellowBatches = activeBatches.filter(b => {
    const d = getDaysRemaining(b.expiryDate);
    return d > 0 && d <= warningThreshold;
  });
  const greenBatches = activeBatches.filter(b => getDaysRemaining(b.expiryDate) > warningThreshold);

  // Handle write-off
  const handleWriteOff = (batch: Batch) => {
    if (confirm(`Quarantine & write off batch ${batch.batchNumber} (${batch.currentQty} ${batch.unit})? This will update inventory and log the audit trail.`)) {
      storage.adjustBatchQty(
        batch.id,
        -batch.currentQty,
        'write_off',
        `Physical expired write-off / safe disposal of ${batch.currentQty} ${batch.unit}`,
        'Rajesh Sharma (Owner)'
      );
    }
  };

  // Filtered and sorted batches
  const filteredBatches = activeBatches.filter(b => {
    const days = getDaysRemaining(b.expiryDate);

    // Search query match
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      (b.productName || '').toLowerCase().includes(q) ||
      b.batchNumber.toLowerCase().includes(q) ||
      b.supplierName.toLowerCase().includes(q);

    // Category match
    const prod = products.find(p => p.id === b.productId);
    const matchCategory = selectedCategory === 'All' || prod?.category === selectedCategory;

    // Expiry Window Filter
    let matchWindow = true;
    if (activeFilter === 'expired') {
      matchWindow = days < 0;
    } else if (activeFilter === 'today') {
      matchWindow = days === 0;
    } else if (activeFilter === 'next_3_days') {
      matchWindow = days >= 0 && days <= 3;
    } else if (activeFilter === 'next_7_days') {
      matchWindow = days >= 0 && days <= 7;
    } else if (activeFilter === 'next_30_days') {
      matchWindow = days >= 0 && days <= 30;
    } else if (activeFilter === 'red_critical') {
      matchWindow = days <= 0;
    } else if (activeFilter === 'yellow_warning') {
      matchWindow = days > 0 && days <= warningThreshold;
    } else if (activeFilter === 'green_safe') {
      matchWindow = days > warningThreshold;
    }

    return matchSearch && matchCategory && matchWindow;
  }).sort((a, b) => {
    let diff = 0;
    if (sortField === 'days') {
      diff = getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate);
    } else if (sortField === 'qty') {
      diff = a.currentQty - b.currentQty;
    } else if (sortField === 'cost') {
      diff = (a.currentQty * a.purchaseCost) - (b.currentQty * b.purchaseCost);
    }
    return sortAsc ? diff : -diff;
  });

  const exportRadarCSV = () => {
    const headers = ['Product', 'Batch Number', 'Expiry Date', 'Days Remaining', 'Status', 'Quantity', 'Unit', 'Unit Cost (INR)', 'Total Capital (INR)', 'Supplier'];
    const rows = filteredBatches.map(b => {
      const days = getDaysRemaining(b.expiryDate);
      const status = days < 0 ? 'EXPIRED' : (days === 0 ? 'EXPIRES_TODAY' : (days <= warningThreshold ? 'EXPIRING_SOON' : 'SAFE'));
      return [
        `"${(b.productName || '').replace(/"/g, '""')}"`,
        `"${b.batchNumber}"`,
        b.expiryDate,
        days,
        status,
        b.currentQty,
        b.unit,
        b.purchaseCost,
        b.currentQty * b.purchaseCost,
        `"${b.supplierName}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expiry_radar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Threshold Configuration */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Expiry Radar</h1>
            <span className="badge badge-critical" style={{ fontSize: 12 }}>FEFO Engine</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Batch-level monitoring, expiry countdown timers, and food safety quarantine gates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Configurable Threshold Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-card)', padding: '6px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Warning Window:</span>
            <input 
              type="range" 
              min="3" 
              max="21" 
              value={warningThreshold} 
              onChange={(e) => setWarningThreshold(Number(e.target.value))}
              style={{ width: 80, accentColor: 'var(--brand-purple)' }}
            />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand-purple)', minWidth: 42 }}>
              {warningThreshold} days
            </span>
          </div>

          <button className="btn btn-secondary" onClick={exportRadarCSV}>
            <Download size={16} />
            <span>Export Radar</span>
          </button>
        </div>
      </div>

      {/* Safety Compliance Alert */}
      <div style={{
        background: 'rgba(139, 92, 246, 0.10)',
        border: '1px solid rgba(139, 92, 246, 0.28)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
        color: 'var(--text-primary)'
      }}>
        <Info size={18} color="var(--brand-purple)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <strong>FSSAI & FEFO Protocol:</strong> Batches are automatically prioritized by First Expired, First Out. Expired batches (RED) are strictly barred from retail sales and human consumption food redistribution.
        </div>
      </div>

      {/* 3-Stage Classification Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16
      }}>
        {/* RED Card */}
        <div 
          style={{
            background: 'var(--critical-red-bg)',
            border: activeFilter === 'red_critical' ? '2px solid var(--critical-red)' : '1px solid var(--critical-red-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onClick={() => setActiveFilter(activeFilter === 'red_critical' ? 'all' : 'red_critical')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="badge badge-critical">RED — CRITICAL</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--critical-red)' }}>
              {redBatches.length} Batches
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--critical-red)', marginTop: 8 }}>
            {redBatches.reduce((a, b) => a + b.currentQty, 0)} <span style={{ fontSize: 14, fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: 12, color: '#8A1F26', marginTop: 4 }}>
            Past expiry or expiring today. Blocked from human sale.
          </div>
        </div>

        {/* YELLOW Card */}
        <div 
          style={{
            background: 'var(--warning-amber-bg)',
            border: activeFilter === 'yellow_warning' ? '2px solid var(--warning-amber)' : '1px solid var(--warning-amber-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onClick={() => setActiveFilter(activeFilter === 'yellow_warning' ? 'all' : 'yellow_warning')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="badge badge-warning">YELLOW — WARNING</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9A6605' }}>
              {yellowBatches.length} Batches
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#9A6605', marginTop: 8 }}>
            {yellowBatches.reduce((a, b) => a + b.currentQty, 0)} <span style={{ fontSize: 14, fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: 12, color: '#6A4604', marginTop: 4 }}>
            Expiring within {warningThreshold} days. Promote or redistribute.
          </div>
        </div>

        {/* GREEN Card */}
        <div 
          style={{
            background: 'var(--safe-green-bg)',
            border: activeFilter === 'green_safe' ? '2px solid var(--safe-green)' : '1px solid var(--safe-green-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onClick={() => setActiveFilter(activeFilter === 'green_safe' ? 'all' : 'green_safe')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="badge badge-normal">GREEN — NORMAL</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--safe-green)' }}>
              {greenBatches.length} Batches
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--safe-green)', marginTop: 8 }}>
            {greenBatches.reduce((a, b) => a + b.currentQty, 0)} <span style={{ fontSize: 14, fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            &gt; {warningThreshold} days remaining. Safe storage conditions.
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {/* Timeline Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Batches' },
              { id: 'expired', label: 'Expired' },
              { id: 'today', label: 'Expiring Today' },
              { id: 'next_3_days', label: 'Next 3 Days' },
              { id: 'next_7_days', label: 'Next 7 Days' },
              { id: 'next_30_days', label: 'Next 30 Days' },
            ].map(f => (
              <button
                key={f.id}
                className={`btn btn-xs ${activeFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12 }}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div style={{ width: 220 }}>
            <input
              type="text"
              className="form-control"
              style={{ height: 34, fontSize: 12.5 }}
              placeholder="Search product or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Batch Radar Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => { setSortField('days'); setSortAsc(!sortAsc); }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Expiry Deadline & Countdown</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th>Product Details</th>
              <th>Batch Code</th>
              <th onClick={() => { setSortField('qty'); setSortAsc(!sortAsc); }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Stock Quantity</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => { setSortField('cost'); setSortAsc(!sortAsc); }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Capital Exposure</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th>Supplier</th>
              <th>Recommended Action</th>
              <th style={{ textAlign: 'right' }}>Direct Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
                  No batches match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredBatches.map(batch => {
                const days = getDaysRemaining(batch.expiryDate);
                const isExpired = days < 0;
                const isToday = days === 0;
                const isWarn = days > 0 && days <= warningThreshold;
                const capital = batch.currentQty * batch.purchaseCost;

                return (
                  <tr key={batch.id} style={{ background: isExpired ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-card)' }}>
                    <td>
                      <div>
                        <span className={`badge ${isExpired || isToday ? 'badge-critical' : (isWarn ? 'badge-warning' : 'badge-normal')}`} style={{ fontSize: 12 }}>
                          {isExpired ? `Expired ${Math.abs(days)}d ago` : (isToday ? 'Expires Today' : `${days} days left`)}
                        </span>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                          Date: <strong>{batch.expiryDate}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{batch.productName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        Received: {batch.receivedDate}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>
                        {batch.batchNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {batch.currentQty} {batch.unit}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Initial: {batch.originalQty} {batch.unit}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: isExpired ? 'var(--critical-red)' : 'inherit' }}>
                        ₹{capital.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        @ ₹{batch.purchaseCost}/{batch.unit}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {batch.supplierName}
                      </span>
                    </td>
                    <td>
                      {isExpired ? (
                        <div style={{ fontSize: 12, color: 'var(--critical-red)', fontWeight: 600 }}>
                          Quarantine & Write-off (Blocked from POS)
                        </div>
                      ) : isToday ? (
                        <div style={{ fontSize: 12, color: '#9A6605', fontWeight: 600 }}>
                          Emergency clearance or Gaushala pickup
                        </div>
                      ) : isWarn ? (
                        <div style={{ fontSize: 12, color: 'var(--forest-green)', fontWeight: 600 }}>
                          FEFO front shelf promotion / NGO donor
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#0E683E' }}>
                          Standard rotation (Safe)
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {/* Food Recovery Match button */}
                        <button
                          className="btn btn-mint btn-xs"
                          onClick={() => onNavigateToRecovery(batch.id)}
                          title="Match with Gaushala or NGO"
                        >
                          <HeartHandshake size={13} />
                          <span>Recovery</span>
                        </button>

                        {/* If not expired, quick POS bundle sale */}
                        {!isExpired && (
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => onNavigateToSales(batch.id)}
                            title="Sell via Counter POS"
                          >
                            <Tag size={13} />
                            <span>Sell</span>
                          </button>
                        )}

                        {/* Write-off button */}
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleWriteOff(batch)}
                          title="Record write-off"
                          style={{ color: 'var(--critical-red)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
