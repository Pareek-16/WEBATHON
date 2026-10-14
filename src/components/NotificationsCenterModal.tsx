import React from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Clock, 
  Package, 
  CheckCircle2, 
  X, 
  ArrowRight,
  Trash2
} from 'lucide-react';
import { NotificationItem, Batch } from '../types';
import { storage } from '../services/storage';

interface NotificationsCenterModalProps {
  notifications: NotificationItem[];
  batches: Batch[];
  onClose: () => void;
  onOpenThreeTapAlert: (notif: NotificationItem) => void;
  onNavigateToRadar: (batchId?: string) => void;
}

export const NotificationsCenterModal: React.FC<NotificationsCenterModalProps> = ({
  notifications,
  batches,
  onClose,
  onOpenThreeTapAlert,
  onNavigateToRadar,
}) => {
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    storage.saveNotifications(updated);
  };

  const handleReviewSingle = (id: string) => {
    storage.markNotificationReviewed(id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 520, maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} color="var(--forest-green)" />
            <h3 className="heading-3">Store Notifications & Alerts</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              className="btn btn-xs btn-secondary" 
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </button>
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 18 }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              No notifications at this time. All stock is within safe thresholds!
            </div>
          ) : (
            notifications.map(n => {
              const isCritical = n.type === 'critical_expiry';
              const isWarning = n.type === 'warning_expiry';
              const isLowStock = n.type === 'low_stock';

              return (
                <div
                  key={n.id}
                  style={{
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isCritical ? 'var(--critical-red-border)' : (isWarning ? 'var(--warning-amber-border)' : 'var(--border-color)')}`,
                    background: isCritical ? '#FFF8F8' : (isWarning ? '#FFFDF8' : '#FFFFFF'),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCritical ? (
                        <ShieldAlert size={18} color="var(--critical-red)" />
                      ) : isWarning ? (
                        <Clock size={18} color="var(--warning-amber)" />
                      ) : (
                        <Package size={18} color="var(--info-blue)" />
                      )}
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: isCritical ? 'var(--critical-red)' : 'var(--text-primary)' }}>
                        {n.title}
                      </span>
                    </div>

                    {!n.read && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--critical-red)', flexShrink: 0 }} />
                    )}
                  </div>

                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCritical && !n.reviewed ? (
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => {
                            onClose();
                            onOpenThreeTapAlert(n);
                          }}
                        >
                          <span>3-Tap Review Protocol</span>
                          <ArrowRight size={12} />
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleReviewSingle(n.id)}
                          disabled={n.reviewed}
                        >
                          {n.reviewed ? 'Reviewed' : 'Acknowledge'}
                        </button>
                      )}

                      {n.batchId && (
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            onClose();
                            onNavigateToRadar(n.batchId);
                          }}
                        >
                          View in Radar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
