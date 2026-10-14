import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Radar, 
  HeartHandshake, 
  FileSpreadsheet, 
  Mic, 
  ShoppingCart, 
  Truck, 
  ClipboardList, 
  Sparkles, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ShopkeeperProfile, NotificationItem } from '../types';
import { AuraStockLogo } from './AuraStockLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: ShopkeeperProfile;
  notifications: NotificationItem[];
  onOpenProfile: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  notifications,
  onOpenProfile,
  mobileOpen,
  setMobileOpen,
}) => {
  const criticalCount = notifications.filter(n => n.type === 'critical_expiry' && !n.reviewed).length;
  const warningCount = notifications.filter(n => n.type === 'warning_expiry' && !n.reviewed).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { 
      id: 'radar', 
      label: 'Expiry Alerts', 
      icon: Radar, 
      badge: criticalCount > 0 ? `${criticalCount}` : (warningCount > 0 ? `${warningCount}` : undefined),
      badgeType: criticalCount > 0 ? 'red' : 'amber'
    },
    { id: 'recovery', label: 'Food Recovery', icon: HeartHandshake, badge: 'Save Food', badgeType: 'purple' },
    { id: 'invoice-ai', label: 'Invoice AI', icon: FileSpreadsheet, badge: 'OCR', badgeType: 'purple' },
    { id: 'assistant', label: 'Aura AI (SOS)', icon: Mic, badge: 'Voice', badgeType: 'purple' },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'purchase-orders', label: 'Reorder / POs', icon: ClipboardList },
    { id: 'festival', label: 'Festival Planner', icon: Sparkles, badge: 'Diwali', badgeType: 'purple' },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 99, background: 'rgba(5, 4, 15, 0.75)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Aurastock Brand Header */}
        <div className="sidebar-header">
          <AuraStockLogo size={36} showText={true} />
        </div>

        {/* Navigation List (clean & spacious) */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Core Operations</div>
          {navItems.slice(0, 6).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <div className="nav-item-left">
                  <Icon size={18} style={{ color: isActive ? '#C084FC' : 'inherit' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`nav-badge nav-badge-${item.badgeType}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: '12px' }}>Commerce & Logistics</div>
          {navItems.slice(6).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <div className="nav-item-left">
                  <Icon size={18} style={{ color: isActive ? '#C084FC' : 'inherit' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`nav-badge nav-badge-${item.badgeType}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Shopkeeper Profile Card (at bottom, independent from navigation scroll) */}
        <div className="sidebar-profile" onClick={onOpenProfile} style={{ cursor: 'pointer' }} title="Click to view & edit store profile">
          <div className="profile-avatar">
            {profile.fullName.charAt(0)}
          </div>
          <div className="profile-info">
            <div className="profile-name">{profile.fullName}</div>
            <div className="profile-role">
              <ShieldCheck size={12} color="#C084FC" />
              <span style={{ textTransform: 'capitalize' }}>{profile.role}</span> &bull; {profile.locality}
            </div>
          </div>
          <button 
            className="icon-btn" 
            style={{ width: 30, height: 30, borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile();
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </aside>
    </>
  );
};
