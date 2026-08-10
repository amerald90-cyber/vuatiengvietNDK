import { create } from 'zustand';
import { SAMPLE_QUESTIONS, shuffleVietnameseWord, splitVietnameseCharacters, checkAnswer, calculatePoints } from '../utils/GameLogic';
import { soundEngine } from '../utils/soundEngine';
import { supabase, broadcastLocalEvent, subscribeLocalEvents } from '../lib/SupabaseClient';

export const useGameStore = create((set, get) => ({
  // AUTH & APP STATE
  isAdminLoggedIn: false,
  adminUser: null,
  role: 'none', // 'none' | 'host' | 'player'
  soundMuted: false,

  // ROOM & GAME STATE
  room: null, // { id, room_code, status, current_question_id, started_at }
  questions: SAMPLE_QUESTIONS,
  currentQuestionIndex: 0,
  currentQuestion: null,

  // PLAYER STATE
  player: null, // { id, room_id, nickname, score, violations, status }
  availableTiles: [],
  selectedTiles: [],
  hasSubmittedCurrentQuestion: false,
  lastAnswerResult: null, // { is_correct, points_earned, message }

  // HOST DATA
  playersList: [],
  answersList: [],

  // ACTIONS

  // 1. Admin Auth Action
  loginAdmin: (username, password) => {
    const envUser = import.meta.env.VITE_ADMIN_USER || 'ngọc đại ka';
    const envPass = import.meta.env.VITE_ADMIN_PASS || 'chaodaika';

    if (username.trim().toLowerCase() === envUser.toLowerCase() && password === envPass) {
      set({ isAdminLoggedIn: true, adminUser: username, role: 'host' });
      return { success: true };
    }
    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu Admin không đúng!' };
  },

  logoutAdmin: () => {
    set({ isAdminLoggedIn: false, adminUser: null, role: 'none', room: null });
  },

  setRole: (role) => set({ role }),

  toggleSound: () => {
    const isMuted = soundEngine.toggleMute();
    set({ soundMuted: isMuted });
  },

  // 2. Host Room Creation
  createRoom: async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newRoom = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'room_' + Date.now(),
      room_code: code,
      host_id: get().adminUser || 'host_ngoc_daika',
      status: 'waiting',
      current_question_id: null,
      started_at: null
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('rooms').insert([newRoom]).select().single();
        if (!error && data) {
          set({ room: data, role: 'host', playersList: [] });
          get().subscribeRoomRealtime(data.id);
          return data;
        }
      } catch (err) {
        console.warn('Supabase DB fallback to local:', err);
      }
    }

    // Local state fallback
    set({ room: newRoom, role: 'host', playersList: [] });
    broadcastLocalEvent('ROOM_CREATED', newRoom);
    get().subscribeLocalRealtime();
    return newRoom;
  },

  // 3. Player Join Room
  joinRoom: async (roomCode, nickname) => {
    let targetRoom = null;

    if (supabase) {
      try {
        const { data: roomData, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_code', roomCode)
          .single();
        if (roomData) targetRoom = roomData;
      } catch (e) {}
    }

    // Fallback to active store room if matching
    if (!targetRoom && get().room && get().room.room_code === roomCode) {
      targetRoom = get().room;
    }

    if (!targetRoom) {
      return { success: false, message: 'Phòng không tồn tại hoặc Mã Phòng sai!' };
    }

    const newPlayer = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'p_' + Date.now(),
      room_id: targetRoom.id,
      nickname: nickname.trim(),
      score: 0,
      violations: 0,
      status: 'active'
    };

    if (supabase) {
      try {
        const { data: pData, error } = await supabase
          .from('players')
          .insert([newPlayer])
          .select()
          .single();
        if (!error && pData) {
          set({ player: pData, room: targetRoom, role: 'player' });
          get().subscribeRoomRealtime(targetRoom.id);
          return { success: true };
        }
      } catch (e) {}
    }

    // Local fallback
    set(state => ({
      player: newPlayer,
      room: targetRoom,
      role: 'player',
      playersList: [...state.playersList.filter(p => p.nickname !== newPlayer.nickname), newPlayer]
    }));
    broadcastLocalEvent('PLAYER_JOINED', newPlayer);
    get().subscribeLocalRealtime();
    return { success: true };
  },

  // 4. Host Starts Game / Advances Question
  startQuestion: async (questionIndex = 0) => {
    const questionsList = get().questions;
    if (questionIndex >= questionsList.length) {
      // Game Finished
      const updatedRoom = { ...get().room, status: 'finished' };
      set({ room: updatedRoom });
      if (supabase) {
        await supabase.from('rooms').update({ status: 'finished' }).eq('id', updatedRoom.id);
      } else {
        broadcastLocalEvent('ROOM_UPDATED', updatedRoom);
      }
      return;
    }

    const q = questionsList[questionIndex];
    const nowIso = new Date().toISOString();

    const updatedRoom = {
      ...get().room,
      status: 'playing',
      current_question_id: q.id,
      started_at: nowIso
    };

    const tiles = shuffleVietnameseWord(q.answer);

    set({
      room: updatedRoom,
      currentQuestionIndex: questionIndex,
      currentQuestion: q,
      availableTiles: tiles,
      selectedTiles: [],
      hasSubmittedCurrentQuestion: false,
      lastAnswerResult: null
    });

    soundEngine.startBgm();

    if (supabase) {
      try {
        await supabase.from('rooms').update({
          status: 'playing',
          current_question_id: q.id,
          started_at: nowIso
        }).eq('id', updatedRoom.id);
      } catch (e) {}
    } else {
      broadcastLocalEvent('QUESTION_STARTED', { room: updatedRoom, question: q, index: questionIndex });
    }
  },

  // 5. Drag & Drop / Tap Tile Assembly logic
  addTileToAnswer: (tileIndex) => {
    const { availableTiles, selectedTiles, player } = get();
    if (player && player.status === 'eliminated') return;

    const tile = availableTiles[tileIndex];
    if (!tile) return;

    const newAvailable = availableTiles.filter((_, idx) => idx !== tileIndex);
    const newSelected = [...selectedTiles, tile];

    set({ availableTiles: newAvailable, selectedTiles: newSelected });
  },

  removeTileFromAnswer: (tileIndex) => {
    const { availableTiles, selectedTiles, player } = get();
    if (player && player.status === 'eliminated') return;

    const tile = selectedTiles[tileIndex];
    if (!tile) return;

    const newSelected = selectedTiles.filter((_, idx) => idx !== tileIndex);
    const newAvailable = [...availableTiles, tile];

    set({ availableTiles: newAvailable, selectedTiles: newSelected });
  },

  resetAnswerTiles: () => {
    const { currentQuestion, player } = get();
    if (!currentQuestion || (player && player.status === 'eliminated')) return;

    const tiles = shuffleVietnameseWord(currentQuestion.answer);
    set({ availableTiles: tiles, selectedTiles: [] });
  },

  // 6. Submit Answer with 60s Server Authoritative Validation
  submitAnswer: async () => {
    const { room, player, currentQuestion, selectedTiles, hasSubmittedCurrentQuestion } = get();
    if (!room || !player || !currentQuestion || hasSubmittedCurrentQuestion) return;
    if (player.status === 'eliminated') {
      return { success: false, message: 'Bạn đã bị loại khỏi lượt chơi do vi phạm quy định!' };
    }

    const submittedAnswerStr = selectedTiles.join('');
    const now = Date.now();
    const startTime = new Date(room.started_at || now).getTime();
    const elapsedSeconds = (now - startTime) / 1000;

    // Server-Authoritative Anti-Cheat 60s Check
    if (elapsedSeconds > 60) {
      soundEngine.playIncorrect();
      set({
        hasSubmittedCurrentQuestion: true,
        lastAnswerResult: { is_correct: false, points_earned: 0, message: 'Hết thời gian (Quá 60s)!' }
      });
      return { success: false, message: 'Đã quá 60 giây! Câu trả lời bị từ chối.' };
    }

    const isCorrect = checkAnswer(submittedAnswerStr, currentQuestion.answer);
    const pointsEarned = isCorrect ? calculatePoints(elapsedSeconds, currentQuestion.points) : 0;

    if (isCorrect) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playIncorrect();
    }

    const answerEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ans_' + Date.now(),
      room_id: room.id,
      player_id: player.id,
      question_id: currentQuestion.id,
      is_correct: isCorrect,
      response_time: parseFloat(elapsedSeconds.toFixed(2)),
      points_earned: pointsEarned
    };

    if (isCorrect) {
      const newScore = player.score + pointsEarned;
      set({ player: { ...player, score: newScore } });
    }

    set({
      hasSubmittedCurrentQuestion: true,
      lastAnswerResult: {
        is_correct: isCorrect,
        points_earned: pointsEarned,
        message: isCorrect ? `Chính xác! +${pointsEarned} điểm` : 'Sai rồi! Hãy chờ câu tiếp theo.'
      }
    });

    if (supabase) {
      try {
        await supabase.rpc('submit_answer', {
          p_room_id: room.id,
          p_player_id: player.id,
          p_question_id: currentQuestion.id,
          p_submitted_answer: submittedAnswerStr
        });
      } catch (e) {
        console.warn('RPC submission failed, inserting directly:', e);
      }
    } else {
      broadcastLocalEvent('ANSWER_SUBMITTED', { answerEntry, player: get().player });
    }

    return { success: true, isCorrect, pointsEarned };
  },

  // 7. Anti-Cheat: Record Tab Switch Violation
  recordTabSwitchViolation: async () => {
    const { player } = get();
    if (!player || player.status === 'eliminated') return;

    const newViolations = player.violations + 1;
    const isEliminated = newViolations >= 2;
    const newStatus = isEliminated ? 'eliminated' : 'active';

    const updatedPlayer = { ...player, violations: newViolations, status: newStatus };
    set({ player: updatedPlayer });

    soundEngine.playIncorrect();

    if (supabase) {
      try {
        await supabase.rpc('record_violation', { p_player_id: player.id });
      } catch (e) {}
    } else {
      broadcastLocalEvent('PLAYER_VIOLATION', { player: updatedPlayer });
    }

    return { violations: newViolations, eliminated: isEliminated };
  },

  // 8. Realtime Subscriptions
  subscribeRoomRealtime: (roomId) => {
    if (!supabase) return;

    const roomSub = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, payload => {
        if (payload.new) {
          set({ room: payload.new });
          if (payload.new.current_question_id) {
            const q = get().questions.find(q => q.id === payload.new.current_question_id);
            if (q) {
              set({
                currentQuestion: q,
                availableTiles: shuffleVietnameseWord(q.answer),
                selectedTiles: [],
                hasSubmittedCurrentQuestion: false,
                lastAnswerResult: null
              });
            }
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, payload => {
        get().fetchRoomPlayers(roomId);
      })
      .subscribe();

    return () => supabase.removeChannel(roomSub);
  },

  subscribeLocalRealtime: () => {
    return subscribeLocalEvents((msg) => {
      const { type, payload } = msg;
      if (type === 'PLAYER_JOINED') {
        set(state => ({
          playersList: [...state.playersList.filter(p => p.id !== payload.id), payload]
        }));
      } else if (type === 'QUESTION_STARTED') {
        set({
          room: payload.room,
          currentQuestion: payload.question,
          currentQuestionIndex: payload.index,
          availableTiles: shuffleVietnameseWord(payload.question.answer),
          selectedTiles: [],
          hasSubmittedCurrentQuestion: false,
          lastAnswerResult: null
        });
      } else if (type === 'ANSWER_SUBMITTED') {
        set(state => ({
          answersList: [...state.answersList, payload.answerEntry],
          playersList: state.playersList.map(p => p.id === payload.player.id ? payload.player : p)
        }));
      } else if (type === 'PLAYER_VIOLATION') {
        set(state => ({
          playersList: state.playersList.map(p => p.id === payload.player.id ? payload.player : p)
        }));
      }
    });
  },

  fetchRoomPlayers: async (roomId) => {
    if (!supabase) return;
    const { data } = await supabase.from('players').select('*').eq('room_id', roomId).order('score', { ascending: false });
    if (data) set({ playersList: data });
  }
}));
