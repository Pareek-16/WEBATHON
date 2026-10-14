import { storage, getDaysRemaining } from './storage';
import { Batch, Product } from '../types';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionRoute?: string;
  actionLabel?: string;
  dataHighlight?: {
    label: string;
    value: string | number;
  }[];
}

// Check Web Speech API Support
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// Text-to-speech speaker
export const speakText = (text: string, lang = 'en-IN') => {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel(); // Stop any active speech

  const cleanText = text.replace(/[#*_`]/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to pick an Indian English or Hindi voice if available
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi'));
  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
};

// Live query processor against actual storage records
export const processUserQuery = (query: string, lang: 'en' | 'hi' | 'hinglish'): AssistantMessage => {
  const q = query.toLowerCase().trim();
  const batches = storage.getBatches().filter(b => b.status === 'active' && b.currentQty > 0);
  const products = storage.getProducts();

  const expiredBatches = batches.filter(b => getDaysRemaining(b.expiryDate) < 0);
  const expiringToday = batches.filter(b => getDaysRemaining(b.expiryDate) === 0);
  const expiringWeek = batches.filter(b => {
    const days = getDaysRemaining(b.expiryDate);
    return days >= 0 && days <= 7;
  });

  const lowStockProducts = products.filter(p => {
    const total = (p.batches || []).reduce((acc, b) => acc + b.currentQty, 0);
    return total > 0 && total <= p.reorderLevel;
  });

  const totalInventoryValue = batches.reduce((acc, b) => acc + (b.currentQty * b.purchaseCost), 0);
  const expiryLossRisk = [...expiredBatches, ...expiringToday, ...expiringWeek].reduce(
    (acc, b) => acc + (b.currentQty * b.purchaseCost), 
    0
  );

  const msgId = 'msg_' + Date.now();
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Expired Stock
  if (q.includes('expired') || q.includes('expire ho gaya') || q.includes('kharab') || q.includes('khatam')) {
    if (expiredBatches.length === 0) {
      return {
        id: msgId,
        sender: 'assistant',
        text: lang === 'hi' 
          ? 'बहुत बढ़िया! अभी आपकी दुकान में कोई भी एक्सपायर्ड बैच नहीं है। सभी स्टॉक सुरक्षित हैं।'
          : 'Great news! There are currently zero expired batches in your active inventory. All stock is safe.',
        timestamp: now,
        actionRoute: 'radar',
        actionLabel: 'View Expiry Radar',
      };
    }

    const itemsSummary = expiredBatches.map(b => `${b.productName} (Batch ${b.batchNumber}: ${b.currentQty} ${b.unit})`).join(', ');
    const text = lang === 'hi'
      ? `सावधान: आपके पास ${expiredBatches.length} एक्सपायर्ड बैच हैं: ${itemsSummary}। कृपया इन्हें तुरंत मानव बिक्री से अलग करें।`
      : `Critical: You have ${expiredBatches.length} expired batch(es) requiring immediate removal: ${itemsSummary}. Safety policy blocks these from human consumption.`;

    return {
      id: msgId,
      sender: 'assistant',
      text,
      timestamp: now,
      actionRoute: 'radar',
      actionLabel: 'Open Expiry Radar',
      dataHighlight: [
        { label: 'Expired Batches', value: expiredBatches.length },
        { label: 'Loss Exposure', value: `₹${expiredBatches.reduce((a, b) => a + (b.currentQty * b.purchaseCost), 0)}` }
      ]
    };
  }

  // 2. Expiring this week / Aaj kaun sa stock
  if (
    q.includes('this week') || 
    q.includes('week') || 
    q.includes('aaj') || 
    q.includes('today') || 
    q.includes('urgent') || 
    q.includes('attention') ||
    q.includes('kaun sa stock') ||
    q.includes('hafta')
  ) {
    const urgentCount = expiredBatches.length + expiringToday.length + expiringWeek.length;
    if (urgentCount === 0) {
      return {
        id: msgId,
        sender: 'assistant',
        text: lang === 'hi'
          ? 'आज और अगले 7 दिनों में कोई भी बैच एक्सपायर नहीं हो रहा है। आपका स्टोर पूरी तरह सुरक्षित स्थिति में है।'
          : 'No batches are expiring today or over the next 7 days. Your store inventory is healthy!',
        timestamp: now,
        actionRoute: 'dashboard',
        actionLabel: 'Back to Dashboard',
      };
    }

    const listNames = expiringWeek.slice(0, 3).map(b => `${b.productName} (${getDaysRemaining(b.expiryDate)}d left)`).join('; ');
    const text = lang === 'hi'
      ? `आज ध्यान देने योग्य: ${expiredBatches.length} एक्सपायर्ड, ${expiringToday.length} आज एक्सपायर हो रहे हैं, और ${expiringWeek.length} अगले 7 दिनों में: ${listNames}। इन्हें FEFO के तहत पहले बेचें या रिकवरी में भेजें।`
      : `Today's priorities: ${expiredBatches.length} expired, ${expiringToday.length} expiring today, and ${expiringWeek.length} within 7 days (${listNames}). Recommended: prioritize FEFO sale or route bakery items to gaushalas.`;

    return {
      id: msgId,
      sender: 'assistant',
      text,
      timestamp: now,
      actionRoute: 'radar',
      actionLabel: 'Review Batches in Radar',
      dataHighlight: [
        { label: 'Expiring in 7 Days', value: expiringWeek.length },
        { label: 'Expiring Today', value: expiringToday.length }
      ]
    };
  }

  // 3. Food Recovery / Gaushala / Farmers / NGO
  if (q.includes('farmer') || q.includes('gaushala') || q.includes('ngo') || q.includes('recovery') || q.includes('bread') || q.includes('donate')) {
    const bakeryOrGrain = batches.filter(b => {
      const days = getDaysRemaining(b.expiryDate);
      return days <= 3 && (b.productName?.toLowerCase().includes('bread') || b.productName?.toLowerCase().includes('atta') || b.productName?.toLowerCase().includes('dal'));
    });

    const text = lang === 'hi'
      ? `फूड रिकवरी मैच: हमारे पास नजफगढ़ में 'श्री कृष्ण गौशाला' और करोल बाग में 'रॉबिन हुड आर्मी' सत्यापित हैं। बिना बिके ब्रेड और अनाज के लिए गौशाला तुरंत पिकअप वाहन भेज सकती है।`
      : `Food Recovery Matches: Found verified partners including 'Shri Krishna Gaushala' (Najafgarh) for bakery/feed surplus, and 'Robin Hood Army' (Karol Bagh) for safe unexpired packaged goods.`;

    return {
      id: msgId,
      sender: 'assistant',
      text,
      timestamp: now,
      actionRoute: 'recovery',
      actionLabel: 'Open Food Recovery Matcher',
      dataHighlight: [
        { label: 'Eligible Surplus Batches', value: bakeryOrGrain.length },
        { label: 'Verified Gaushalas/NGOs', value: 4 }
      ]
    };
  }

  // 4. Low stock / Reorder
  if (q.includes('reorder') || q.includes('low stock') || q.includes('mangal') || q.includes('order karna') || q.includes('stock kam')) {
    if (lowStockProducts.length === 0) {
      return {
        id: msgId,
        sender: 'assistant',
        text: lang === 'hi'
          ? 'आपके सभी प्रोडक्ट्स पर्याप्त मात्रा में उपलब्ध हैं। कोई भी आइटम रीऑर्डर थ्रेशोल्ड से नीचे नहीं है।'
          : 'All products currently have healthy stock above their minimum reorder thresholds.',
        timestamp: now,
        actionRoute: 'inventory',
        actionLabel: 'View Inventory',
      };
    }

    const items = lowStockProducts.map(p => `${p.name} (Available: ${(p.batches || []).reduce((a, b) => a + b.currentQty, 0)} ${p.unit}, Reorder level: ${p.reorderLevel})`).join('; ');
    const text = lang === 'hi'
      ? `रीऑर्डर की आवश्यकता: ${lowStockProducts.length} प्रोडक्ट्स अपने न्यूनतम स्तर पर हैं: ${items}। कृपया सप्लायर को परचेज आर्डर भेजें।`
      : `Reorder Required: ${lowStockProducts.length} product(s) are at or below safety stock: ${items}. You can generate draft purchase orders with 1-click.`;

    return {
      id: msgId,
      sender: 'assistant',
      text,
      timestamp: now,
      actionRoute: 'purchase-orders',
      actionLabel: 'Create Purchase Order',
      dataHighlight: [
        { label: 'Items to Reorder', value: lowStockProducts.length }
      ]
    };
  }

  // 5. Valuation / Value
  if (q.includes('valuation') || q.includes('value') || q.includes('worth') || q.includes('kimat') || q.includes('total stock')) {
    const text = lang === 'hi'
      ? `आपकी कुल इन्वेंटरी का खरीद मूल्य ₹${totalInventoryValue.toLocaleString('en-IN')} है। इसमें से ₹${expiryLossRisk.toLocaleString('en-IN')} मूल्य का स्टॉक अगले 7 दिनों में एक्सपायरी जोखिम में है।`
      : `Your total current inventory purchase valuation is ₹${totalInventoryValue.toLocaleString('en-IN')}. Expiry exposure (batches expired or due within 7 days) represents ₹${expiryLossRisk.toLocaleString('en-IN')}.`;

    return {
      id: msgId,
      sender: 'assistant',
      text,
      timestamp: now,
      actionRoute: 'reports',
      actionLabel: 'View Valuation Report',
      dataHighlight: [
        { label: 'Total Stock Valuation', value: `₹${totalInventoryValue.toLocaleString('en-IN')}` },
        { label: 'At Risk (7-Day Exposure)', value: `₹${expiryLossRisk.toLocaleString('en-IN')}` }
      ]
    };
  }

  // 6. Festival / Diwali
  if (q.includes('festival') || q.includes('diwali') || q.includes('tyohar') || q.includes('holi') || q.includes('planner')) {
    const text = lang === 'hi'
      ? `दिवाली और त्योहारों के दौरान तेल, घी, मैदा और चॉकलेट की मांग 2.2x से 3.5x तक बढ़ जाती है। फॉर्च्यून ऑयल और आशीर्वाद आटा के लिए 49 यूनिट्स का बफर आर्डर अनुशंसित है।`
      : `Festival Demand Forecast: During major Indian festivals like Diwali, demand for cooking oils, ghee, atta, and gifting confectionery surges by 2.2x to 3.5x. Supplier lead times increase by 3-5 days. Check our pre-calculated reorder buffer.`;

    return {
      id: msgId,
      sender: 'assistant',
      text,
      timestamp: now,
      actionRoute: 'festival',
      actionLabel: 'Open Festival Planner',
      dataHighlight: [
        { label: 'Diwali Demand Surge', value: '+140% to +250%' },
        { label: 'Estimated Purchasing Need', value: '₹38,400' }
      ]
    };
  }

  // Default Fallback
  const defaultText = lang === 'hi'
    ? `नमस्ते! मैं SmartStock AI असिस्टेंट हूँ। आप मुझसे एक्सपायरी की स्थिति, गौशाला व एनजीओ रिकवरी, रीऑर्डर लिस्ट, या दिवाली स्टॉक प्लान के बारे में पूछ सकते हैं।`
    : `Hello! I am your SmartStock AI Assistant. Ask me about today's expiry priorities, low stock reorders, Food Recovery matches for gaushalas/NGOs, or festival stock forecasts.`;

  return {
    id: msgId,
    sender: 'assistant',
    text: defaultText,
    timestamp: now,
    actionRoute: 'radar',
    actionLabel: 'Explore Expiry Radar',
  };
};
