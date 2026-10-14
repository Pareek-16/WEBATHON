import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Volume2, 
  VolumeX, 
  Globe, 
  Menu, 
  Store, 
  Sun,
  Moon,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { ShopkeeperProfile, NotificationItem, Product, Batch } from '../types';
import { audioAlerts, isQuietHoursActive } from '../services/audioAlerts';

interface HeaderProps {
  profile: ShopkeeperProfile;
  notifications: NotificationItem[];
  products: Product[];
  batches: Batch[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onToggleMobileMenu: () => void;
  onSelectLanguage: (lang: 'en' | 'hi' | 'hinglish') => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  notifications,
  products,
  batches,
  theme,
  onToggleTheme,
  onSelectProduct,
  onOpenNotifications,
  onOpenProfile,
  onToggleMobileMenu,
  onSelectLanguage,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(profile.audioAlertsEnabled);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadNotifs = notifications.filter(n => !n.read);
  const quietHours = isQuietHoursActive(profile.quietHoursStart, profile.quietHoursEnd);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for universal search
  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchName = p.name.toLowerCase().includes(q);
    const matchBrand = p.brand.toLowerCase().includes(q);
    const matchCategory = p.category.toLowerCase().includes(q);
    const matchBarcode = p.barcode.includes(q);
    const matchSku = p.sku.toLowerCase().includes(q);
    const matchBatch = (p.batches || []).some(b => 
      b.batchNumber.toLowerCase().includes(q) || 
      b.supplierName.toLowerCase().includes(q)
    );
    return matchName || matchBrand || matchCategory || matchBarcode || matchSku || matchBatch;
  }).slice(0, 6);

  const handleTestAudio = () => {
    audioAlerts.playCriticalAlert(true);
  };

  return (
    <header className="top-header">
      {/* Left: Mobile Menu + Store Selector + Search */}
      <div className="header-left">
        <button 
          className="icon-btn" 
          style={{ display: 'none' }}
          id="mobile-menu-btn"
          onClick={onToggleMobileMenu}
        >
          <Menu size={20} />
        </button>

        {/* Current Shop Selector */}
        <button className="shop-selector-btn" onClick={onOpenProfile} title="Active Store Details">
          <Store size={16} color="#A855F7" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 700 }}>{profile.shopName}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{profile.locality}, {profile.city}</span>
          </div>
          <ChevronDown size={14} color="var(--text-secondary)" />
        </button>

        {/* Universal Search Box */}
        <div className="search-box" ref={searchRef}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search products, barcodes, batches, categories..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showSearchResults && filteredProducts.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 1000,
              overflow: 'hidden',
              maxHeight: 380,
              overflowY: 'auto'
            }}>
              <div style={{ padding: '10px 16px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                MATCHING PRODUCTS & BATCHES ({filteredProducts.length})
              </div>
              {filteredProducts.map(prod => {
                const totalStock = (prod.batches || []).reduce((acc, b) => acc + b.currentQty, 0);
                const isLow = totalStock <= prod.reorderLevel;
                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      onSelectProduct(prod);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{prod.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, marginTop: 2 }}>
                        <span>{prod.brand}</span> &bull; 
                        <span>{prod.category}</span> &bull; 
                        <span>Barcode: {prod.barcode}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${isLow ? 'badge-warning' : 'badge-normal'}`}>
                        {totalStock} {prod.unit}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {prod.batches?.length || 0} batches
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="header-right">
        {/* Light / Dark Mode Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} color="#FBBF24" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} color="#7C3AED" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Demo Mode Toggle Pill */}
        <div 
          className="badge badge-purple" 
          onClick={onToggleDemoMode}
          style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
          title="Click to toggle Demo Mode / Live records"
        >
          <Sparkles size={13} />
          <span>{isDemoMode ? 'Demo Mode' : 'Live Store'}</span>
        </div>

        {/* Audio Alerts Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="icon-btn"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) {
                audioAlerts.playWarningChime(true);
              }
            }}
            title={soundEnabled ? (quietHours ? 'Audio Enabled (Quiet Hours)' : 'Audio Alerts Active — Click to Mute') : 'Audio Alerts Muted'}
          >
            {soundEnabled ? (
              <Volume2 size={18} color={quietHours ? 'var(--warning-amber)' : 'var(--text-primary)'} />
            ) : (
              <VolumeX size={18} color="var(--critical-red)" />
            )}
          </button>
        </div>

        {/* Language Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowLangMenu(!showLangMenu)}
            title="Select Language"
          >
            <Globe size={18} />
          </button>
          {showLangMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 1000,
              width: 140,
              overflow: 'hidden'
            }}>
              <button 
                className="nav-item" 
                style={{ padding: '9px 14px', fontSize: 13, color: profile.preferredLanguage === 'en' ? '#C084FC' : 'inherit', fontWeight: profile.preferredLanguage === 'en' ? 700 : 400 }}
                onClick={() => { onSelectLanguage('en'); setShowLangMenu(false); }}
              >
                English
              </button>
              <button 
                className="nav-item" 
                style={{ padding: '9px 14px', fontSize: 13, color: profile.preferredLanguage === 'hi' ? '#C084FC' : 'inherit', fontWeight: profile.preferredLanguage === 'hi' ? 700 : 400 }}
                onClick={() => { onSelectLanguage('hi'); setShowLangMenu(false); }}
              >
                हिन्दी (Hindi)
              </button>
              <button 
                className="nav-item" 
                style={{ padding: '9px 14px', fontSize: 13, color: profile.preferredLanguage === 'hinglish' ? '#C084FC' : 'inherit', fontWeight: profile.preferredLanguage === 'hinglish' ? 700 : 400 }}
                onClick={() => { onSelectLanguage('hinglish'); setShowLangMenu(false); }}
              >
                Hinglish
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          className="icon-btn"
          onClick={onOpenNotifications}
          title="Notifications & Expiry Alerts"
        >
          <Bell size={18} />
          {unreadNotifs.length > 0 && (
            <span className="badge-counter">
              {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
            </span>
          )}
        </button>

        {/* Shopkeeper Profile Avatar */}
        <div 
          className="profile-avatar" 
          onClick={onOpenProfile} 
          style={{ cursor: 'pointer', width: 38, height: 38 }}
          title={`${profile.fullName} (${profile.role})`}
        >
          {profile.fullName.charAt(0)}
        </div>
      </div>
    </header>
  );
};
