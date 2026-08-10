import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local BroadcastChannel helper for dev testing when Supabase is not connected
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
