import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { 
  Product, 
  Batch, 
  ShopkeeperProfile, 
  NotificationItem, 
  Supplier, 
  PurchaseOrder, 
  StockMovement, 
  SaleRecord, 
  FoodRecoveryRecipient, 
  RecoveryTransferRecord, 
  FestivalPlan 
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { ExpiryRadarView } from './components/ExpiryRadarView';
import { FoodRecoveryView } from './components/FoodRecoveryView';
import { InvoiceAIView } from './components/InvoiceAIView';
import { VoiceAssistantView } from './components/VoiceAssistantView';
import { SalesPOSView } from './components/SalesPOSView';
import { SuppliersAndPOView } from './components/SuppliersAndPOView';
import { FestivalPlannerView } from './components/FestivalPlannerView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ThreeTapAlertModal } from './components/ThreeTapAlertModal';
import { NotificationsCenterModal } from './components/NotificationsCenterModal';

export const App: React.FC = () => {
  // Theme state: dark (default from Aurastock mockup) or light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('aurastock_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aurastock_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initialize local storage on load
  useEffect(() => {
    storage.init();
  }, []);

  // State synced with Storage
  const [profile, setProfile] = useState<ShopkeeperProfile>(storage.getProfile());
  const [products, setProducts] = useState<Product[]>(storage.getProducts());
  const [batches, setBatches] = useState<Batch[]>(storage.getBatches());
  const [suppliers, setSuppliers] = useState<Supplier[]>(storage.getSuppliers());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(storage.getPurchaseOrders());
  const [movements, setMovements] = useState<StockMovement[]>(storage.getMovements());
  const [sales, setSales] = useState<SaleRecord[]>(storage.getSales());
  const [notifications, setNotifications] = useState<NotificationItem[]>(storage.getNotifications());
  const [recipients, setRecipients] = useState<FoodRecoveryRecipient[]>(storage.getRecipients());
  const [transfers, setTransfers] = useState<RecoveryTransferRecord[]>(storage.getRecoveryTransfers());
  const [festivalPlans, setFestivalPlans] = useState<FestivalPlan[]>(storage.getFestivalPlans());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(storage.isDemoMode());

  // UI state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [subFilter, setSubFilter] = useState<string>('');
  const [activeBatchIdForRoute, setActiveBatchIdForRoute] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [activeThreeTapAlert, setActiveThreeTapAlert] = useState<NotificationItem | null>(null);

  // Sync state on custom event
  const reloadData = () => {
    setProfile(storage.getProfile());
    setProducts(storage.getProducts());
    setBatches(storage.getBatches());
    setSuppliers(storage.getSuppliers());
    setPurchaseOrders(storage.getPurchaseOrders());
    setMovements(storage.getMovements());
    setSales(storage.getSales());
    setNotifications(storage.getNotifications());
    setRecipients(storage.getRecipients());
    setTransfers(storage.getRecoveryTransfers());
    setFestivalPlans(storage.getFestivalPlans());
    setIsDemoMode(storage.isDemoMode());
  };

  useEffect(() => {
    window.addEventListener('smartstock_update', reloadData);
    return () => window.removeEventListener('smartstock_update', reloadData);
  }, []);

  // Navigation handlers with parameters
  const handleNavigate = (tab: string, filter?: string, batchId?: string) => {
    setActiveTab(tab);
    if (filter) setSubFilter(filter);
    if (batchId) setActiveBatchIdForRoute(batchId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    handleNavigate('inventory');
  };

  const handleSelectLanguage = (lang: 'en' | 'hi' | 'hinglish') => {
    const updated = { ...profile, preferredLanguage: lang };
    storage.saveProfile(updated);
    setProfile(updated);
  };

  const handleToggleDemoMode = () => {
    const next = !isDemoMode;
    storage.setDemoMode(next);
    setIsDemoMode(next);
  };

  const selectedAlertBatch = activeThreeTapAlert?.batchId 
    ? batches.find(b => b.id === activeThreeTapAlert.batchId)
    : undefined;

  return (
    <div className="app-container">
      {/* Persistent Desktop Sidebar with Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => handleNavigate(tab)}
        profile={profile}
        notifications={notifications}
        onOpenProfile={() => handleNavigate('settings')}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Workspace Wrapper */}
      <div className="main-wrapper">
        {/* Sticky Top Header */}
        <Header
          profile={profile}
          notifications={notifications}
          products={products}
          batches={batches}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSelectProduct={handleSelectProduct}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenProfile={() => handleNavigate('settings')}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          onSelectLanguage={handleSelectLanguage}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
        />

        {/* View Routing */}
        <main style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              products={products}
              batches={batches}
              notifications={notifications}
              sales={sales}
              onNavigate={handleNavigate}
              onOpenAddProduct={() => handleNavigate('inventory')}
              onOpenThreeTapAlert={(notif) => setActiveThreeTapAlert(notif)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              batches={batches}
              suppliers={suppliers}
              initialFilter={subFilter}
              onNavigateToRadar={(batchId) => handleNavigate('radar', undefined, batchId)}
              onNavigateToRecovery={(batchId) => handleNavigate('recovery', undefined, batchId)}
            />
          )}

          {activeTab === 'radar' && (
            <ExpiryRadarView
              batches={batches}
              products={products}
              profile={profile}
              initialFilter={subFilter}
              onNavigateToRecovery={(batchId) => handleNavigate('recovery', undefined, batchId)}
              onNavigateToSales={(batchId) => handleNavigate('sales', undefined, batchId)}
            />
          )}

          {activeTab === 'recovery' && (
            <FoodRecoveryView
              batches={batches}
              products={products}
              recipients={recipients}
              profile={profile}
              initialBatchId={activeBatchIdForRoute}
            />
          )}

          {activeTab === 'invoice-ai' && (
            <InvoiceAIView
              products={products}
              suppliers={suppliers}
              profile={profile}
              onNavigateToInventory={() => handleNavigate('inventory')}
              onNavigateToRadar={() => handleNavigate('radar')}
            />
          )}

          {activeTab === 'assistant' && (
            <VoiceAssistantView
              profile={profile}
              onNavigate={(tab) => handleNavigate(tab)}
            />
          )}

          {activeTab === 'sales' && (
            <SalesPOSView
              products={products}
              batches={batches}
              profile={profile}
              initialBatchId={activeBatchIdForRoute}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersAndPOView
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              products={products}
              profile={profile}
              initialTab="suppliers"
            />
          )}

          {activeTab === 'purchase-orders' && (
            <SuppliersAndPOView
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              products={products}
              profile={profile}
              initialTab="orders"
            />
          )}

          {activeTab === 'festival' && (
            <FestivalPlannerView
              festivalPlans={festivalPlans}
              products={products}
              batches={batches}
              profile={profile}
              onNavigateToPOs={() => handleNavigate('purchase-orders')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              sales={sales}
              movements={movements}
              batches={batches}
              products={products}
              transfers={transfers}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={profile}
              isDemoMode={isDemoMode}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onProfileUpdated={(updated) => setProfile(updated)}
              onDemoModeToggled={(demo) => setIsDemoMode(demo)}
            />
          )}
        </main>
      </div>

      {/* Global Deliberate 3-Tap Acknowledgement Modal */}
      {activeThreeTapAlert && (
        <ThreeTapAlertModal
          notification={activeThreeTapAlert}
          batch={selectedAlertBatch}
          onClose={() => setActiveThreeTapAlert(null)}
          onNavigateToRadar={() => handleNavigate('radar')}
          onNavigateToRecovery={() => handleNavigate('recovery')}
        />
      )}

      {/* Global Notifications Center Modal */}
      {showNotificationsModal && (
        <NotificationsCenterModal
          notifications={notifications}
          batches={batches}
          onClose={() => setShowNotificationsModal(false)}
          onOpenThreeTapAlert={(notif) => {
            setShowNotificationsModal(false);
            setActiveThreeTapAlert(notif);
          }}
          onNavigateToRadar={(batchId) => handleNavigate('radar', undefined, batchId)}
        />
      )}
    </div>
  );
};

export default App;
