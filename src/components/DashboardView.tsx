import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight, 
  PlusCircle, 
  FileSpreadsheet, 
  ShoppingCart, 
  HeartHandshake, 
  Sparkles, 
  Bot,
  Layers,
  ChevronRight,
  IndianRupee,
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Product, Batch, NotificationItem, ShopkeeperProfile, SaleRecord } from '../types';
import { getDaysRemaining } from '../services/storage';

interface DashboardViewProps {
  profile: ShopkeeperProfile;
  products: Product[];
  batches: Batch[];
  notifications: NotificationItem[];
  sales: SaleRecord[];
  onNavigate: (tab: string, filter?: string) => void;
  onOpenAddProduct: () => void;
  onOpenThreeTapAlert: (notif: NotificationItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  products,
  batches,
  notifications,
  sales,
  onNavigate,
  onOpenAddProduct,
  onOpenThreeTapAlert,
}) => {
  const activeBatches = batches.filter(b => b.status === 'active' && b.currentQty > 0);

  // Group batches by 3-stage expiry classification
  const redBatches = activeBatches.filter(b => getDaysRemaining(b.expiryDate) <= 0);
  const yellowBatches = activeBatches.filter(b => {
    const days = getDaysRemaining(b.expiryDate);
    return days > 0 && days <= profile.warningThresholdDays;
  });
  const greenBatches = activeBatches.filter(b => getDaysRemaining(b.expiryDate) > profile.warningThresholdDays);

  const totalProductsCount = products.length;
  const totalStockUnits = activeBatches.reduce((acc, b) => acc + b.currentQty, 0);
  const lowStockProducts = products.filter(p => {
    const stock = (p.batches || []).reduce((acc, b) => acc + b.currentQty, 0);
    return stock > 0 && stock <= p.reorderLevel;
  });

  const expiredCount = redBatches.length;
  const expiringSoonCount = yellowBatches.length;

  // Inventory valuation & capital exposure
  const totalValuation = activeBatches.reduce((acc, b) => acc + (b.currentQty * b.purchaseCost), 0);
  const expiryExposureLoss = [...redBatches, ...yellowBatches].reduce((acc, b) => acc + (b.currentQty * b.purchaseCost), 0);

  // Find nearest upcoming batches for expiry list
  const sortedUpcomingBatches = [...activeBatches].sort((a, b) => 
    getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate)
  );

  // Unreviewed critical notifications
  const criticalNotifs = notifications.filter(n => n.type === 'critical_expiry' && !n.reviewed);

  // Today's formatted date
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Top Header & Fast Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Inventory Overview</h1>
            <span className="badge badge-purple" style={{ fontSize: 11.5 }}>
              <Sparkles size={13} />
              <span>Live Intelligence</span>
            </span>
          </div>
          <p style={{ marginTop: 4, fontSize: 13.5 }}>
            Welcome back, <strong>{profile.fullName}</strong> &bull; {profile.shopName} ({profile.locality}) &bull; {todayStr}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onOpenAddProduct}>
            <PlusCircle size={16} />
            <span>Add Product</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('invoice-ai')}>
            <FileSpreadsheet size={16} />
            <span>Invoice AI</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('sales')}>
            <ShoppingCart size={16} />
            <span>Counter POS</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('recovery')}>
            <HeartHandshake size={16} />
            <span>Food Recovery</span>
          </button>
        </div>
      </div>

      {/* Floating Aura AI Insight Banner (Inspired by User Screenshot) */}
      <div className="aura-ai-floating-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.45)',
            flexShrink: 0
          }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Aura AI</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>&bull; Just Now</span>
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              {redBatches.length > 0 ? (
                <span>⚠️ <strong>{redBatches.length} items</strong> have expired or expire today! Shall I isolate them and route to Gaushalas?</span>
              ) : yellowBatches.length > 0 ? (
                <span>⚠️ <strong>{yellowBatches.length} items</strong> are expiring within 7 days! Shall I suggest FEFO counter clearance discounts?</span>
              ) : (
                <span>✨ All inventory batches are in safe rotation. <strong>Diwali festive preparation</strong> buffer is ready for review.</span>
              )}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0 }}
          onClick={() => onNavigate(redBatches.length > 0 ? 'radar' : (yellowBatches.length > 0 ? 'radar' : 'festival'))}
        >
          <span>View Suggestions</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4 Primary Metric Cards (Matching User Screenshot Layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18
      }}>
        {/* Card 1: Total Products */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'var(--transition)' }}
          onClick={() => onNavigate('inventory')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="text-caption">Total Products</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="text-metric">{totalProductsCount}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            {totalStockUnits} total units in stock
          </div>
        </div>

        {/* Card 2: Expiring Soon */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'var(--transition)' }}
          onClick={() => onNavigate('radar', 'next_7_days')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="text-caption" style={{ color: expiringSoonCount > 0 ? '#F59E0B' : 'inherit' }}>Expiring Soon</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--warning-amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="text-metric" style={{ color: expiringSoonCount > 0 ? '#F59E0B' : 'inherit' }}>
            {expiringSoonCount}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            Within {profile.warningThresholdDays || 7} days deadline
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'var(--transition)' }}
          onClick={() => onNavigate('inventory', 'low_stock')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="text-caption" style={{ color: lowStockProducts.length > 0 ? '#EF4444' : 'inherit' }}>Low Stock</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--critical-red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-metric" style={{ color: lowStockProducts.length > 0 ? '#EF4444' : 'inherit' }}>
            {lowStockProducts.length}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            Below safety reorder level
          </div>
        </div>

        {/* Card 4: Total Value */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'var(--transition)' }}
          onClick={() => onNavigate('reports')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="text-caption">Total Value</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--info-cyan-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info-cyan)' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="text-metric" style={{ color: 'var(--info-cyan)' }}>
            ₹{totalValuation.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6 }}>
            Purchase cost valuation
          </div>
        </div>
      </div>

      {/* Main Two-Column Section: Expiry Alerts & AI Recommendations (Matching Screenshot) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Left Card: Expiry Alerts List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={18} color="#A855F7" />
              <span>Expiry Alerts</span>
            </div>
            <button className="btn btn-xs btn-secondary" onClick={() => onNavigate('radar')}>
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedUpcomingBatches.slice(0, 5).map(batch => {
              const days = getDaysRemaining(batch.expiryDate);
              const isCritical = days <= 0;
              const isHigh = days > 0 && days <= 3;
              const isMedium = days > 3 && days <= 7;

              let badgeText = 'Safe';
              let badgeClass = 'badge-normal';

              if (isCritical) {
                badgeText = days < 0 ? `Expired ${Math.abs(days)}d` : 'Critical (Today)';
                badgeClass = 'badge-critical';
              } else if (isHigh) {
                badgeText = 'High';
                badgeClass = 'badge-warning';
              } else if (isMedium) {
                badgeText = 'Medium';
                badgeClass = 'badge-purple';
              }

              return (
                <div
                  key={batch.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: isCritical ? 'var(--critical-red-bg)' : 'rgba(168, 85, 247, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCritical ? 'var(--critical-red)' : '#C084FC',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      {batch.productName?.charAt(0) || 'P'}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {batch.productName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Batch #{batch.batchNumber} &bull; {days < 0 ? `Expired ${Math.abs(days)} days ago` : (days === 0 ? 'Expires today' : `Expires in ${days} days`)} ({batch.currentQty} {batch.unit})
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: 11, minWidth: 64, justifyContent: 'center' }}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: AI Recommendations (Matching Screenshot) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} color="#A855F7" />
              <span>AI Recommendations</span>
            </div>
            <button className="btn btn-xs btn-secondary" onClick={() => onNavigate('radar')}>
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Recommendation 1: Sell First (FEFO) */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onClick={() => onNavigate('radar', 'next_7_days')}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>Sell First (FEFO Priority)</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Milk, Paneer, Whole Wheat Bread (3 batches near deadline)
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </div>

            {/* Recommendation 2: Reorder Now */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onClick={() => onNavigate('purchase-orders')}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>Reorder Now (Fast Movers)</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Tata Toor Dal, India Gate Rice (Below reorder threshold)
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </div>

            {/* Recommendation 3: Wasted Stock Risk & Food Recovery */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onClick={() => onNavigate('recovery')}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>Food Recovery Match</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Shri Krishna Gaushala available for unsold bakery pickup
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Low Stock Alert Pill (Matching User Screenshot) */}
      {lowStockProducts.length > 0 && (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--warning-amber-bg)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                Low Stock Alert: {lowStockProducts[0].name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                Stock is at {(lowStockProducts[0].batches || []).reduce((a, b) => a + b.currentQty, 0)} {lowStockProducts[0].unit} (Minimum threshold: {lowStockProducts[0].reorderLevel} {lowStockProducts[0].unit})
              </div>
            </div>
          </div>

          <button className="btn btn-warning btn-sm" onClick={() => onNavigate('purchase-orders')}>
            <span>Reorder Now</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Weekly Sales Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} color="#A855F7" />
            <span>Weekly Sales & Velocity</span>
          </div>
          <span className="badge badge-normal">
            ₹{sales.reduce((a, s) => a + s.total, 0).toLocaleString('en-IN')} Billing Recorded
          </span>
        </div>

        {/* Clean SVG Bar Chart */}
        <div style={{ height: 180, width: '100%', display: 'flex', alignItems: 'flex-end', gap: 16, paddingTop: 20 }}>
          {[
            { day: 'Thu', val: 2400 },
            { day: 'Fri', val: 3100 },
            { day: 'Sat', val: 4800 },
            { day: 'Sun', val: 5600 },
            { day: 'Mon', val: 2900 },
            { day: 'Tue', val: 3400 },
            { day: 'Today', val: 3800, active: true },
          ].map((col, i) => {
            const maxVal = 6000;
            const heightPct = Math.round((col.val / maxVal) * 100);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>₹{col.val}</span>
                <div 
                  style={{
                    width: '100%',
                    maxWidth: 36,
                    height: `${heightPct}%`,
                    background: col.active ? 'linear-gradient(180deg, #C084FC, #7C3AED)' : 'var(--surface-alt)',
                    borderRadius: '6px 6px 0 0',
                    boxShadow: col.active ? '0 4px 16px rgba(168, 85, 247, 0.4)' : 'none',
                    transition: 'height 0.3s ease'
                  }} 
                  title={`Day: ${col.day}\nSales: ₹${col.val}`}
                />
                <span style={{ fontSize: 12, fontWeight: col.active ? 800 : 500, color: col.active ? '#C084FC' : 'var(--text-secondary)' }}>
                  {col.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
