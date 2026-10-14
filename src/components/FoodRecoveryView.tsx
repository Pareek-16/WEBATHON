import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FoodRecoveryRecipient, Batch, Product, RecoveryTransferRecord, ShopkeeperProfile } from '../types';
import { storage, getDaysRemaining } from '../services/storage';
import { audioAlerts } from '../services/audioAlerts';

interface FoodRecoveryViewProps {
  batches: Batch[];
  products: Product[];
  recipients: FoodRecoveryRecipient[];
  profile: ShopkeeperProfile;
  initialBatchId?: string;
}

export const FoodRecoveryView: React.FC<FoodRecoveryViewProps> = ({
  batches,
  products,
  recipients,
  profile,
  initialBatchId,
}) => {
  const activeBatches = batches.filter(b => b.status === 'active' && b.currentQty > 0);

  // Default selected batch or first eligible batch
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || activeBatches.find(b => getDaysRemaining(b.expiryDate) <= 7)?.id || activeBatches[0]?.id || ''
  );

  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'cattle_farmer' | 'ngo_foodbank' | 'chemist_retailer'>('all');
  const [showTransferModal, setShowTransferModal] = useState<{ recipient: FoodRecoveryRecipient; batch: Batch } | null>(null);
  const [transferQty, setTransferQty] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState<string>('');

  const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);
  const selectedProduct = selectedBatch ? products.find(p => p.id === selectedBatch.productId) : null;
  const daysRemaining = selectedBatch ? getDaysRemaining(selectedBatch.expiryDate) : 0;
  const isExpired = daysRemaining < 0;

  // Recovery matching algorithm with explicit eligibility explanation
  const getEligibilityAnalysis = (recipient: FoodRecoveryRecipient, batch: Batch, product: Product | null) => {
    const days = getDaysRemaining(batch.expiryDate);
    const category = product?.category || '';

    // Safety rule 1: Human NGOs cannot receive expired food
    if (recipient.category === 'ngo_foodbank') {
      if (days < 0) {
        return {
          eligible: false,
          reason: 'STRICT HUMAN SAFETY BLOCK: Product is past expiry date. Expired food cannot be distributed for human consumption under FSSAI rules.',
          badgeType: 'critical',
        };
      }
      if (days < 2) {
        return {
          eligible: false,
          reason: 'Insufficient shelf life (< 2 days remaining) for safe NGO logistics and distribution cycle.',
          badgeType: 'warning',
        };
      }
      if (recipient.acceptedCategories.includes(category)) {
        return {
          eligible: true,
          reason: `Verified Match: Unexpired ${category} with ${days} days shelf life intact. Packaging is sealed and safe for human consumption.`,
          badgeType: 'normal',
        };
      }
      return {
        eligible: false,
        reason: `Category mismatch: Recipient accepts ${recipient.acceptedCategories.join(', ')}.`,
        badgeType: 'neutral',
      };
    }

    // Safety rule 2: Cattle caretakers / Gaushalas
    if (recipient.category === 'cattle_farmer') {
      const isBreadOrGrain = 
        category === 'Bread & Bakery' || 
        category === 'Rice, Wheat, Flour & Pulses' ||
        category.includes('Grain');

      if (!isBreadOrGrain) {
        return {
          eligible: false,
          reason: 'Animal Feed Ineligible: Only grains, pulses, and dry bakery products are suitable for ruminant cattle feed.',
          badgeType: 'neutral',
        };
      }

      return {
        eligible: true,
        reason: days < 0 
          ? `Eligible Feed: Expired day-old bread/grain surplus suitable for registered Gaushala cattle feed (provided free from fungus/mold).`
          : `High Priority Feed: Surplus bakery/grains suitable for immediate livestock feed preparation.`,
        badgeType: 'normal',
      };
    }

    // Safety rule 3: Chemists / Health Retailers
    if (recipient.category === 'chemist_retailer') {
      if (category !== 'Health & Nutrition' && category !== 'Packaged Beverages & Health Drinks') {
        return {
          eligible: false,
          reason: 'Category restricted: Chemist secondary channel accepts only eligible OTC nutrition powders and health supplements.',
          badgeType: 'neutral',
        };
      }
      if (days < 15) {
        return {
          eligible: false,
          reason: 'Minimum 15-day shelf life required for secondary retail distribution.',
          badgeType: 'warning',
        };
      }
      return {
        eligible: true,
        reason: 'Authorized OTC Match: Sealed nutritional product with adequate remaining shelf life.',
        badgeType: 'normal',
      };
    }

    return {
      eligible: false,
      reason: 'No criteria matched.',
      badgeType: 'neutral',
    };
  };

  const handleStartTransfer = (recipient: FoodRecoveryRecipient) => {
    if (!selectedBatch) return;
    setTransferQty(selectedBatch.currentQty);
    setTransferNotes(`Surplus recovery handover from ${profile.shopName} to ${recipient.name}`);
    setShowTransferModal({ recipient, batch: selectedBatch });
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal) return;

    const { recipient, batch } = showTransferModal;
    const capitalSaved = transferQty * batch.purchaseCost;

    storage.executeRecoveryTransfer({
      batchId: batch.id,
      productId: batch.productId,
      productName: batch.productName || 'Surplus Item',
      quantity: transferQty,
      unit: batch.unit,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientCategory: recipient.category,
      purposeNotes: transferNotes,
      contactPerson: recipient.contactPerson,
      wastePreventedKg: Math.round(transferQty * 0.4), // approx kg estimate
      capitalSavedInr: capitalSaved,
    });

    // Play pleasant celebratory audio tone
    audioAlerts.playSuccessTone();

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setShowTransferModal(null);
  };

  // Prefilled WhatsApp message generator
  const getWhatsAppUrl = (recipient: FoodRecoveryRecipient, batch: Batch) => {
    const text = encodeURIComponent(
      `Namaste ${recipient.contactPerson}, I am Rajesh Sharma from Sharma Kirana Store (${profile.locality}). We have ${batch.currentQty} ${batch.unit} of ${batch.productName} (Batch ${batch.batchNumber}, Expiry: ${batch.expiryDate}) available for food recovery / cattle feed pickup. Please confirm if your volunteer/vehicle can collect from our store: ${profile.address}, ${profile.locality}. Phone: ${profile.phone}.`
    );
    return `https://wa.me/${recipient.whatsapp}?text=${text}`;
  };

  const filteredRecipients = recipients.filter(r => {
    if (activeCategoryTab === 'all') return true;
    return r.category === activeCategoryTab;
  });

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Core Philosophy */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="heading-1">Food Recovery Platform</h1>
            <span className="badge badge-normal" style={{ fontSize: 12 }}>Zero Waste & Bull/NGO Directory</span>
          </div>
          <p style={{ marginTop: 4 }}>
            Match eligible grocery surplus with verified Gaushalas, hunger relief NGOs, and health retailers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-mint" style={{ padding: '6px 12px', fontSize: 13 }}>
            <Sparkles size={14} />
            <span>Safety-First Verification</span>
          </span>
        </div>
      </div>

      {/* Safety Policy Header Banner */}
      <div style={{
        background: '#FAFBFB',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--forest-green)', color: 'var(--mint-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={20} />
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <strong>Core Product Principle: Food safety takes priority over recovery or resale value.</strong>
          <br />
          <span style={{ color: 'var(--text-secondary)' }}>
            &bull; Expired food is strictly prohibited for human consumption (blocked from NGOs).
            &bull; Day-old bakery and grains may be repurposed for verified cattle feed if free from mold and toxins.
          </span>
        </div>
      </div>

      {/* Step 1: Select Surplus Batch Selector */}
      <div className="card" style={{ padding: 18 }}>
        <div className="card-header" style={{ marginBottom: 12 }}>
          <div className="card-title">
            <Truck size={18} color="var(--forest-green)" />
            <span>Select Stock Batch to Match</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Showing batches near deadline or requiring redistribution
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {activeBatches.slice(0, 6).map(b => {
            const days = getDaysRemaining(b.expiryDate);
            const isSelected = b.id === selectedBatchId;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBatchId(b.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '2px solid var(--forest-green)' : '1px solid var(--border-color)',
                  background: isSelected ? '#F2F7F4' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{b.productName}</span>
                  <span className={`badge ${days <= 0 ? 'badge-critical' : (days <= 7 ? 'badge-warning' : 'badge-normal')}`} style={{ fontSize: 10 }}>
                    {days < 0 ? `Expired ${Math.abs(days)}d` : (days === 0 ? 'Today' : `${days}d left`)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Batch: {b.batchNumber}</span>
                  <strong>{b.currentQty} {b.unit} available</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Batch Summary Banner */}
      {selectedBatch && (
        <div style={{
          background: isExpired ? '#FFF8F8' : '#F8FAF9',
          border: isExpired ? '1px solid #FCD4D6' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Batch for Redistribution
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
              {selectedBatch.productName} &bull; Batch {selectedBatch.batchNumber}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Quantity: <strong>{selectedBatch.currentQty} {selectedBatch.unit}</strong> &bull; Purchase Cost: <strong>₹{selectedBatch.purchaseCost * selectedBatch.currentQty}</strong> &bull; Expiry Date: <strong>{selectedBatch.expiryDate}</strong> ({daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days left`})
            </div>
          </div>

          <div>
            <span className={`badge ${isExpired ? 'badge-critical' : (daysRemaining <= 7 ? 'badge-warning' : 'badge-normal')}`} style={{ fontSize: 13, padding: '4px 12px' }}>
              {isExpired ? 'Restricted to Animal Feed' : 'Safe for Human NGO Donation'}
            </span>
          </div>
        </div>
      )}

      {/* Category Tabs for Recipients */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Recipients' },
          { id: 'cattle_farmer', label: 'A. Cattle Caretakers & Gaushalas' },
          { id: 'ngo_foodbank', label: 'B. Food Redistribution NGOs' },
          { id: 'chemist_retailer', label: 'C. Chemists & Health Retailers' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-xs ${activeCategoryTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '5px 14px', fontSize: 12.5 }}
            onClick={() => setActiveCategoryTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recipient Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 18
      }}>
        {filteredRecipients.map(rec => {
          const analysis = selectedBatch 
            ? getEligibilityAnalysis(rec, selectedBatch, selectedProduct || null)
            : { eligible: true, reason: 'Select a batch to evaluate safety criteria', badgeType: 'neutral' };

          return (
            <div 
              key={rec.id} 
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: analysis.eligible ? 'var(--mint-border)' : 'var(--border-color)',
                opacity: analysis.eligible ? 1 : 0.85
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <h3 className="heading-3" style={{ fontSize: 16 }}>{rec.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} />
                      <span>{rec.locality} &bull; <strong>{rec.distanceKm} km away</strong></span>
                    </div>
                  </div>
                  <span className={`badge badge-${analysis.badgeType === 'critical' ? 'critical' : (analysis.badgeType === 'normal' ? 'normal' : 'neutral')}`} style={{ fontSize: 11 }}>
                    {rec.categoryLabel}
                  </span>
                </div>

                {/* Match Evaluation Callout */}
                <div style={{
                  margin: '14px 0',
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  background: analysis.eligible ? '#E8F5EE' : (analysis.badgeType === 'critical' ? '#FDF1F2' : '#F5F7F4'),
                  border: `1px solid ${analysis.eligible ? '#B8E7CD' : (analysis.badgeType === 'critical' ? '#F7B5B9' : 'var(--border-color)')}`,
                  fontSize: 12.5,
                  lineHeight: 1.4
                }}>
                  <div style={{ fontWeight: 700, color: analysis.eligible ? '#0E683E' : (analysis.badgeType === 'critical' ? 'var(--critical-red)' : 'var(--text-primary)'), marginBottom: 4 }}>
                    {analysis.eligible ? '✓ Eligible for Transfer' : '✕ Transfer Ineligible'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {analysis.reason}
                  </div>
                </div>

                {/* Recipient Acceptance Criteria */}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  <strong>Accepts:</strong> {rec.acceptedCategories.join(', ')}
                  <br />
                  <span style={{ fontStyle: 'italic', display: 'block', marginTop: 4 }}>
                    "{rec.acceptanceConditions}"
                  </span>
                </div>
              </div>

              {/* Action Buttons: Call, WhatsApp, Confirm Handover */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <a
                  href={`tel:${rec.phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, minWidth: 100 }}
                  title={`Call ${rec.contactPerson} at ${rec.phone}`}
                >
                  <Phone size={14} />
                  <span>Call ({rec.phone.slice(-4)})</span>
                </a>

                {selectedBatch && (
                  <a
                    href={getWhatsAppUrl(rec, selectedBatch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minWidth: 110, color: '#075E54' }}
                    title="Send WhatsApp with batch details"
                  >
                    <MessageSquare size={14} color="#25D366" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {analysis.eligible && selectedBatch && (
                  <button
                    className="btn btn-mint btn-sm"
                    style={{ width: '100%', marginTop: 4 }}
                    onClick={() => handleStartTransfer(rec)}
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm Handover ({selectedBatch.currentQty} {selectedBatch.unit})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIRM HANDOVER MODAL */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="heading-3">Confirm Food Recovery Transfer</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Recipient: <strong>{showTransferModal.recipient.name}</strong>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowTransferModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleConfirmTransfer}>
              <div className="modal-body">
                <div style={{ background: '#F8FAF9', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Product:</span>{' '}
                      <strong>{showTransferModal.batch.productName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Batch:</span>{' '}
                      <strong>{showTransferModal.batch.batchNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Recipient Type:</span>{' '}
                      <strong>{showTransferModal.recipient.categoryLabel}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Contact Person:</span>{' '}
                      <strong>{showTransferModal.recipient.contactPerson}</strong>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity to Transfer ({showTransferModal.batch.unit}) *</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max={showTransferModal.batch.currentQty}
                    required
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                  />
                  <div className="form-hint">
                    Maximum available in this batch: {showTransferModal.batch.currentQty} {showTransferModal.batch.unit}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Purpose & Verification Notes</label>
                  <textarea
                    className="form-control"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                  />
                </div>

                <div style={{ background: '#E8F5EE', border: '1px solid #B8E7CD', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 12.5, color: 'var(--forest-green)' }}>
                  ✓ This transaction will automatically deduct {transferQty} {showTransferModal.batch.unit} from your active store inventory and log an audit movement.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-mint">
                  Confirm & Log Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
