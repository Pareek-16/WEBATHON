import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Store, 
  ShieldCheck, 
  Bell, 
  Volume2, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  Lock,
  Phone,
  Clock,
  Sparkles
} from 'lucide-react';
import { ShopkeeperProfile } from '../types';
import { storage } from '../services/storage';
import { audioAlerts } from '../services/audioAlerts';

interface SettingsViewProps {
  profile: ShopkeeperProfile;
  isDemoMode: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onProfileUpdated: (profile: ShopkeeperProfile) => void;
  onDemoModeToggled: (demo: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  isDemoMode,
  theme = 'dark',
  onToggleTheme,
  onProfileUpdated,
  onDemoModeToggled,
}) => {
  const [formData, setFormData] = useState<ShopkeeperProfile>({ ...profile });
  const [maskLicense, setMaskLicense] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field: keyof ShopkeeperProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // Indian 10-digit phone validation
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    storage.saveProfile(formData);
    onProfileUpdated(formData);
    setSaveSuccess(true);
    audioAlerts.playSuccessTone();

    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  const handleResetDemo = () => {
    if (confirm('Reset database back to the standard Indian Kirana Store demo data? All temporary entries will be replaced with clean demo records.')) {
      storage.resetAll();
      alert('Database reset to fresh demo data.');
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const data = {
      profile: storage.getProfile(),
      products: storage.getProducts(),
      batches: storage.getBatches(),
      suppliers: storage.getSuppliers(),
      purchaseOrders: storage.getPurchaseOrders(),
      movements: storage.getMovements(),
      sales: storage.getSales(),
      recipients: storage.getRecipients(),
      transfers: storage.getRecoveryTransfers(),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartstock_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Store Profile & Settings</h1>
            <span className="badge badge-normal" style={{ fontSize: 12 }}>Owner Settings</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Manage shopkeeper identity, FSSAI trade credentials, alert thresholds, and data backup.
          </p>
        </div>

        {saveSuccess && (
          <div className="badge badge-normal" style={{ padding: '6px 14px', fontSize: 13 }}>
            <CheckCircle2 size={16} />
            <span>Profile Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1: Shopkeeper Personal Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <User size={18} color="var(--forest-green)" />
              <span>Shopkeeper & Store Identity</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Shopkeeper Full Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shop / Trade Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.shopName}
                onChange={(e) => handleInputChange('shopName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number (10 digits) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  +91
                </span>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: 46 }}
                  maxLength={10}
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role in Store</label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              >
                <option value="owner">Proprietor / Owner</option>
                <option value="manager">Store Manager</option>
                <option value="staff">Billing Staff / Cashier</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Shop Address & Market *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Locality / Colony *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.locality}
                onChange={(e) => handleInputChange('locality', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">City & Pincode *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="110005"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Trade & FSSAI Regulatory License (Confidential) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="var(--forest-green)" />
              <span>FSSAI & Trade License Credentials</span>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>
              <Lock size={12} />
              <span>Confidential Internal Record</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>License / Registration Number</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setMaskLicense(!maskLicense)}
                >
                  {maskLicense ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{maskLicense ? 'Unhide' : 'Mask'}</span>
                </button>
              </div>
              <input
                type="text"
                className="form-control"
                value={maskLicense ? formData.tradeLicenseNo.replace(/.(?=.{4})/g, '•') : formData.tradeLicenseNo}
                onChange={(e) => handleInputChange('tradeLicenseNo', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">License Type</label>
              <input
                type="text"
                className="form-control"
                value={formData.licenseType}
                onChange={(e) => handleInputChange('licenseType', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Issuing Authority</label>
              <input
                type="text"
                className="form-control"
                value={formData.issuingAuthority}
                onChange={(e) => handleInputChange('issuingAuthority', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">License Validity / Expiry Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.licenseExpiryDate}
                onChange={(e) => handleInputChange('licenseExpiryDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification & Audio Alert Preferences */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Bell size={18} color="var(--forest-green)" />
              <span>Expiry Thresholds & Audible Beep Preferences</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Early Expiry Warning Window (Days)</label>
              <input
                type="number"
                className="form-control"
                min="3"
                max="30"
                value={formData.warningThresholdDays}
                onChange={(e) => handleInputChange('warningThresholdDays', Number(e.target.value))}
              />
              <div className="form-hint">Default is 7 days prior to recorded expiry date.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Critical Alarm Window (Days)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                max="5"
                value={formData.criticalThresholdDays}
                onChange={(e) => handleInputChange('criticalThresholdDays', Number(e.target.value))}
              />
              <div className="form-hint">Default is 2 days or 0 (today) for Red Critical Stage.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Audible Alert Sound Pattern</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.audioAlertsEnabled}
                    onChange={(e) => handleInputChange('audioAlertsEnabled', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--forest-green)' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Enable Restrained Beep on Critical Alert</span>
                </label>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() => audioAlerts.playCriticalAlert(true)}
                >
                  <Volume2 size={13} />
                  <span>Test Beep</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quiet Hours (Silences Audio)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>From:</span>
                  <input
                    type="time"
                    className="form-control"
                    style={{ height: 36, fontSize: 13 }}
                    value={formData.quietHoursStart}
                    onChange={(e) => handleInputChange('quietHoursStart', e.target.value)}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>To:</span>
                  <input
                    type="time"
                    className="form-control"
                    style={{ height: 36, fontSize: 13 }}
                    value={formData.quietHoursEnd}
                    onChange={(e) => handleInputChange('quietHoursEnd', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Interface Theme Appearance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} color="#A855F7" />
              <span>Interface Appearance (Light & Dark Mode)</span>
            </div>
            <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
              Current: {theme} Mode
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Dark Theme Option */}
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: '#090818',
                border: theme === 'dark' ? '2px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                boxShadow: theme === 'dark' ? '0 0 20px rgba(168, 85, 247, 0.3)' : 'none',
                transition: 'var(--transition)'
              }}
              onClick={() => {
                if (theme !== 'dark' && onToggleTheme) onToggleTheme();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>Midnight Obsidian (Dark)</span>
                {theme === 'dark' && (
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>Active</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#9E9BBF', marginTop: 4 }}>
                Sleek neon purple accents, deep dark surfaces, and optimal contrast for low-light shop counters.
              </div>
            </div>

            {/* Light Theme Option */}
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: '#FFFFFF',
                border: theme === 'light' ? '2px solid #7C3AED' : '1px solid #E2E6F2',
                cursor: 'pointer',
                boxShadow: theme === 'light' ? '0 0 20px rgba(124, 58, 237, 0.2)' : 'none',
                transition: 'var(--transition)'
              }}
              onClick={() => {
                if (theme !== 'light' && onToggleTheme) onToggleTheme();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#121028' }}>Crisp Lavender (Light)</span>
                {theme === 'light' && (
                  <span className="badge badge-normal" style={{ fontSize: 10 }}>Active</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#5F5B7D', marginTop: 4 }}>
                Clean white surfaces, lilac borders, and high daylight visibility for bright retail stores.
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Demo Mode & Backup Controls */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} color="#A855F7" />
              <span>Demo Mode & Database Maintenance</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Seed Data & Demonstration Mode</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Toggle between realistic FMCG seed products and clean production store records.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className={`btn btn-sm ${isDemoMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onDemoModeToggled(!isDemoMode)}
              >
                {isDemoMode ? 'Demo Mode Active' : 'Enable Demo Mode'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetDemo}
                style={{ color: 'var(--critical-red)' }}
              >
                <RotateCcw size={14} />
                <span>Reset Demo Data</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportBackup}
              >
                <Download size={14} />
                <span>Export JSON Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Changes Floating Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 20 }}>
          <button type="submit" className="btn btn-primary" style={{ height: 46, padding: '0 24px', fontSize: 15 }}>
            <Save size={18} />
            <span>Save Store Profile & Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
