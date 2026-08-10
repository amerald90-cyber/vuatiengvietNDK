/**
 * GameLogic.js - Core logic for Vietnamese Text Processing, Anti-Cheat, and Scoring Rules
 */

// 10 SAMPLE QUESTIONS SEED
export const SAMPLE_QUESTIONS = [
  { id: '1', answer: 'AI', difficulty: 'Dễ', points: 100, order_index: 1 },
  { id: '2', answer: 'PROMPT', difficulty: 'Dễ', points: 100, order_index: 2 },
  { id: '3', answer: 'CHATGPT', difficulty: 'TB', points: 200, order_index: 3 },
  { id: '4', answer: 'DỮ LIỆU', difficulty: 'TB', points: 200, order_index: 4 },
  { id: '5', answer: 'TỰ ĐỘNG HÓA', difficulty: 'Khó', points: 300, order_index: 5 },
  { id: '6', answer: 'CÁ NHÂN HÓA', difficulty: 'Khó', points: 300, order_index: 6 },
  { id: '7', answer: 'TRÍ TUỆ NHÂN TẠO', difficulty: 'Khó', points: 300, order_index: 7 },
  { id: '8', answer: 'GENERATIVE AI', difficulty: 'Khó', points: 300, order_index: 8 },
  { id: '9', answer: 'AI AGENT', difficulty: 'Khó', points: 300, order_index: 9 },
  { id: '10', answer: 'TƯƠNG LAI', difficulty: 'TB', points: 200, order_index: 10 }
];

/**
 * Splitting Vietnamese text into grapheme clusters (letters + full diacritics intact)
 * E.g. 'TRÍ' -> ['T', 'R', 'Í'] (Accents stay attached to vowels)
 */
export const splitVietnameseCharacters = (text) => {
  if (!text) return [];
  const normalized = text.trim().toUpperCase();

  // If Intl.Segmenter is supported, use standard unicode grapheme segmentation
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(normalized), s => s.segment);
  }
  
  // Fallback to array expansion (preserves composite precomposed Unicode characters in JS)
  return Array.from(normalized);
};

/**
 * Shuffle letters or words while strictly preserving accents and diacritics.
 * For long phrases with spaces, splits either into word units or letter units cleanly.
 */
export const shuffleVietnameseWord = (answer) => {
  if (!answer) return [];
  const upper = answer.trim().toUpperCase();

  // For multi-word answers with > 2 words (e.g. 'TỰ ĐỘNG HÓA', 'TRÍ TUỆ NHÂN TẠO'),
  // we can create word tiles or combined letter tiles to make it fun & playable.
  const words = upper.split(/\s+/);
  
  let tiles = [];
  if (words.length > 1 && upper.length > 8) {
    // Multi-word phrase: shuffle by words and major syllable blocks
    tiles = [...words];
  } else {
    // Single word or short phrase: split by letters while keeping spaces intact or filtering
    tiles = splitVietnameseCharacters(upper).filter(ch => ch !== ' ');
  }

  // Knuth / Fisher-Yates shuffle
  const shuffled = [...tiles];
  let attempts = 0;
  
  while (attempts < 10) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Make sure shuffled version isn't identical to original if length > 1
    if (shuffled.join('') !== tiles.join('') || tiles.length <= 1) break;
    attempts++;
  }

  return shuffled;
};

/**
 * Validate answer against target with diacritic & whitespace normalization
 */
export const checkAnswer = (userAnswer, targetAnswer) => {
  if (!userAnswer || !targetAnswer) return false;
  const cleanUser = userAnswer.trim().replace(/\s+/g, ' ').toUpperCase();
  const cleanTarget = targetAnswer.trim().replace(/\s+/g, ' ').toUpperCase();
  return cleanUser === cleanTarget;
};

/**
 * Calculate dynamic score based on response time (< 60s rule)
 */
export const calculatePoints = (responseTimeSeconds, basePoints = 100) => {
  if (responseTimeSeconds > 60) return 0; // Over 60s rejected
  const remaining = Math.max(0, 60 - responseTimeSeconds);
  const timeBonusMultiplier = 1 + (remaining / 120); // max +50% bonus
  return Math.round(basePoints * timeBonusMultiplier);
};

/**
 * Server-authoritative anti-cheat validator
 */
export const validateSubmissionTime = (questionStartedAt) => {
  if (!questionStartedAt) return { valid: true, elapsedSeconds: 0 };
  const startTime = new Date(questionStartedAt).getTime();
  const now = Date.now();
  const elapsedSeconds = (now - startTime) / 1000;
  
  if (elapsedSeconds > 60) {
    return { valid: false, elapsedSeconds, reason: 'Time limit exceeded (> 60s).' };
  }
  return { valid: true, elapsedSeconds };
};

/**
 * Anti-Cheat tab switch listener setup
 */
export const initAntiCheatListener = (onViolationDetected) => {
  if (typeof document === 'undefined') return () => {};

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      onViolationDetected();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};
