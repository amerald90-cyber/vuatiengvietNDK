import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only enable real Supabase if credentials are valid and NOT placeholder values
const isConfigured = 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local BroadcastChannel helper for multi-tab testing
const localChannel = typeof window !== 'undefined' ? new BroadcastChannel('ai_word_challenge_channel') : null;

export const broadcastLocalEvent = (event, payload) => {
  if (localChannel) {
    localChannel.postMessage({ type: event, payload, timestamp: Date.now() });
  }
};

export const subscribeLocalEvents = (callback) => {
  if (!localChannel) return () => {};
  const handler = (e) => callback(e.data);
  localChannel.addEventListener('message', handler);
  return () => localChannel.removeEventListener('message', handler);
};

export default supabase;
