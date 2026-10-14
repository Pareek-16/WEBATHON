import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  Package, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { NotificationItem, Batch } from '../types';
import { storage } from '../services/storage';

interface ThreeTapAlertModalProps {
  notification: NotificationItem;
  batch?: Batch;
  onClose: () => void;
  onNavigateToRadar: () => void;
  onNavigateToRecovery: () => void;
}

export const ThreeTapAlertModal: React.FC<ThreeTapAlertModalProps> = ({
  notification,
  batch,
  onClose,
  onNavigateToRadar,
  onNavigateToRecovery,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(notification.acknowledgementStep || 1);
  const [safetyChecked, setSafetyChecked] = useState(false);

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      storage.setNotificationStep(notification.id, 2);
    } else if (currentStep === 2) {
      if (!safetyChecked) return;
      setCurrentStep(3);
      storage.setNotificationStep(notification.id, 3);
    } else if (currentStep === 3) {
      storage.markNotificationReviewed(notification.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 540 }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with 3-Tap Progress Stepper */}
        <div className="modal-header" style={{ background: '#FAFBFB' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--critical-red-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--critical-red)'
              }}>
                <ShieldAlert size={16} />
              </div>
              <h3 className="heading-3" style={{ fontSize: 16 }}>Critical Expiry Acknowledgement</h3>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Deliberate 3-Step Verification Protocol for Store Operations
            </div>
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Visual Progress Stepper Indicator */}
        <div style={{ padding: '14px 24px', background: '#F5F7F4', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              background: currentStep >= 1 ? 'var(--forest-green)' : '#CAD5CE', 
              color: '#FFFFFF', 
              fontSize: 12, 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              1
            </span>
            <span style={{ fontSize: 12, fontWeight: currentStep === 1 ? 700 : 500, color: currentStep === 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Open Alert
            </span>
          </div>
          <div style={{ flex: 1, height: 2, background: currentStep >= 2 ? 'var(--forest-green)' : '#DCE5E0', margin: '0 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              background: currentStep >= 2 ? 'var(--forest-green)' : '#CAD5CE', 
              color: '#FFFFFF', 
              fontSize: 12, 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              2
            </span>
            <span style={{ fontSize: 12, fontWeight: currentStep === 2 ? 700 : 500, color: currentStep === 2 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Safety Review
            </span>
          </div>
          <div style={{ flex: 1, height: 2, background: currentStep >= 3 ? 'var(--forest-green)' : '#DCE5E0', margin: '0 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              background: currentStep >= 3 ? 'var(--forest-green)' : '#CAD5CE', 
              color: '#FFFFFF', 
              fontSize: 12, 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              3
            </span>
            <span style={{ fontSize: 12, fontWeight: currentStep === 3 ? 700 : 500, color: currentStep === 3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Acknowledge
            </span>
          </div>
        </div>

        {/* Step 1: Open Alert & Inspection */}
        {currentStep === 1 && (
          <div className="modal-body">
            <div style={{ background: 'var(--critical-red-bg)', border: '1px solid var(--critical-red-border)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--critical-red)', fontWeight: 700, fontSize: 14 }}>
                <AlertTriangle size={18} />
                <span>{notification.title}</span>
              </div>
              <p style={{ color: '#881F25', fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>
                {notification.message}
              </p>
            </div>

            {batch && (
              <div style={{ background: '#F8FAF9', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Affected Batch Specifications
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Batch Code:</span>{' '}
                    <strong>{batch.batchNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span>{' '}
                    <strong style={{ color: 'var(--critical-red)' }}>{batch.expiryDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Quantity:</span>{' '}
                    <strong>{batch.currentQty} {batch.unit}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Supplier:</span>{' '}
                    <span>{batch.supplierName}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-secondary)', background: '#FEF8ED', border: '1px solid #FCDCA0', padding: 12, borderRadius: 'var(--radius-sm)' }}>
              <strong>Notice:</strong> Moving to Step 2 will inspect the required safety protocol. This item remains recorded in inventory until an authorized stock adjustment is performed.
            </div>
          </div>
        )}

        {/* Step 2: Safety Protocol & Inspection */}
        {currentStep === 2 && (
          <div className="modal-body">
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
              Step 2 of 3: Safety Operating Protocol
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              To ensure consumer safety and compliance with FSSAI regulations, please confirm the following steps:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ background: '#E8F5EE', color: 'var(--forest-green)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  A
                </div>
                <div style={{ fontSize: 13 }}>
                  <strong>Physically isolate from shelf:</strong> Move batch away from customer reach to the backroom quarantine crate.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ background: '#E8F5EE', color: 'var(--forest-green)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  B
                </div>
                <div style={{ fontSize: 13 }}>
                  <strong>Human Consumption Block:</strong> Expired food is blocked from billing counter and cannot be transferred to food charities for human use.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ background: '#E8F5EE', color: 'var(--forest-green)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  C
                </div>
                <div style={{ fontSize: 13 }}>
                  <strong>Redistribution:</strong> Eligible bread and grains may be routed to verified cattle caretakers/gaushalas if free from mold/rot.
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 12, background: '#F8FAF9', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <input 
                type="checkbox" 
                checked={safetyChecked} 
                onChange={(e) => setSafetyChecked(e.target.checked)} 
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--forest-green)' }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                I confirm I have physically inspected and quarantined this stock.
              </span>
            </label>
          </div>
        )}

        {/* Step 3: Formal Shopkeeper Acknowledgement */}
        {currentStep === 3 && (
          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
              <div style={{ 
                width: 52, 
                height: 52, 
                borderRadius: '50%', 
                background: '#E8F5EE', 
                color: 'var(--forest-green)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <ShieldCheck size={28} />
              </div>
              <h3 className="heading-3" style={{ fontSize: 18 }}>Step 3 of 3: Formal Acknowledgement</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 420, margin: '6px auto 0' }}>
                Acknowledging this alert records that store management has reviewed this critical batch deadline. It does not automatically delete inventory.
              </p>
            </div>

            <div style={{ background: '#F8FAF9', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 14, fontSize: 13, lineHeight: 1.6 }}>
              <div><strong>Audited Store:</strong> Sharma Kirana & General Store (Karol Bagh)</div>
              <div><strong>Reviewing Officer:</strong> Rajesh Sharma (Owner)</div>
              <div><strong>Acknowledge Timestamp:</strong> {new Date().toLocaleString('en-IN')}</div>
              <div><strong>Product Status:</strong> Quarantined & Blocked from POS sale</div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ flex: 1 }}
                onClick={() => {
                  storage.markNotificationReviewed(notification.id);
                  onClose();
                  onNavigateToRecovery();
                }}
              >
                Open Food Recovery
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ flex: 1 }}
                onClick={() => {
                  storage.markNotificationReviewed(notification.id);
                  onClose();
                  onNavigateToRadar();
                }}
              >
                Inspect in Radar
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer with Step CTA */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>

          {currentStep === 1 && (
            <button className="btn btn-primary" onClick={handleNextStep}>
              <span>Tap 2 of 3: Review Safety Protocol</span>
              <ArrowRight size={16} />
            </button>
          )}

          {currentStep === 2 && (
            <button 
              className="btn btn-primary" 
              onClick={handleNextStep}
              disabled={!safetyChecked}
            >
              <span>Tap 3 of 3: Confirm Acknowledgement</span>
              <ArrowRight size={16} />
            </button>
          )}

          {currentStep === 3 && (
            <button className="btn btn-mint" onClick={handleNextStep}>
              <span>Complete Verification</span>
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
