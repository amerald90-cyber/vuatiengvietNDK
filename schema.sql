-- ========================================================
-- AI WORD CHALLENGE (TRÍ TUỆ TỪ VỰNG AI) - DATABASE SCHEMA
-- Execute this SQL script in the Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DROP EXISTING TABLES IF NEEDED
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS questions CASCADE;

-- 2. CREATE QUESTIONS TABLE
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer VARCHAR(255) NOT NULL,
    shuffled_letters JSONB NOT NULL, -- Array of shuffled tiles/letters
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Dễ', 'TB', 'Khó')),
    points INT NOT NULL DEFAULT 100,
    order_index INT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE ROOMS TABLE
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(10) UNIQUE NOT NULL,
    host_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    current_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE PLAYERS TABLE
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    nickname VARCHAR(100) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    violations INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated')),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, nickname)
);

-- 5. CREATE ANSWERS TABLE
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    response_time NUMERIC(5,2) NOT NULL DEFAULT 0,
    points_earned INT NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, player_id, question_id)
);

-- INDEXES FOR FAST REALTIME LOOKUPS
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_players_room ON players(room_id);
CREATE INDEX idx_answers_room_q ON answers(room_id, question_id);

-- 6. REALTIME BROADCAST ENABLING
-- Add tables to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms, players, questions, answers;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping publication setup if standalone pg environment';
END $$;

-- 7. SERVER-SIDE VALIDATION & ANTI-CHEAT FUNCTIONS (RPC)

-- Function: Submit Answer with 60s Server Authoritative Validation
CREATE OR REPLACE FUNCTION submit_answer(
    p_room_id UUID,
    p_player_id UUID,
    p_question_id UUID,
    p_submitted_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_status TEXT;
    v_started_at TIMESTAMPTZ;
    v_correct_answer TEXT;
    v_base_points INT;
    v_elapsed_seconds NUMERIC;
    v_is_correct BOOLEAN := FALSE;
    v_points_earned INT := 0;
    v_player_status TEXT;
BEGIN
    -- Check player status
    SELECT status INTO v_player_status FROM players WHERE id = p_player_id;
    IF v_player_status = 'eliminated' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Player has been eliminated due to violations.');
    END IF;

    -- Fetch room current status and question start time
    SELECT status, started_at INTO v_room_status, v_started_at
    FROM rooms WHERE id = p_room_id;

    IF v_room_status != 'playing' OR v_started_at IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Room is not actively playing.');
    END IF;

    -- Calculate elapsed time
    v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_started_at));

    -- Anti-cheat Server Rule: Over 60 seconds -> REJECT!
    IF v_elapsed_seconds > 60 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Time limit exceeded (> 60s). Submission rejected.');
    END IF;

    -- Fetch correct question answer & base points
    SELECT answer, points INTO v_correct_answer, v_base_points
    FROM questions WHERE id = p_question_id;

    -- Normalize string comparison (Trim & Upper case matching)
    IF UPPER(TRIM(p_submitted_answer)) = UPPER(TRIM(v_correct_answer)) THEN
        v_is_correct := TRUE;
        -- Calculate dynamic score: Faster answers get bonus points up to 1.5x
        v_points_earned := GREATEST(10, ROUND(v_base_points * (1 + (60 - v_elapsed_seconds) / 120.0)));
    ELSE
        v_is_correct := FALSE;
        v_points_earned := 0;
    END IF;

    -- Record or update answer entry
    INSERT INTO answers (room_id, player_id, question_id, is_correct, response_time, points_earned)
    VALUES (p_room_id, p_player_id, p_question_id, v_is_correct, v_elapsed_seconds, v_points_earned)
    ON CONFLICT (room_id, player_id, question_id) 
    DO UPDATE SET 
        is_correct = EXCLUDED.is_correct,
        response_time = EXCLUDED.response_time,
        points_earned = EXCLUDED.points_earned,
        submitted_at = NOW();

    -- Update player cumulative score if correct
    IF v_is_correct THEN
        UPDATE players 
        SET score = score + v_points_earned,
            last_active = NOW()
        WHERE id = p_player_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'is_correct', v_is_correct,
        'points_earned', v_points_earned,
        'response_time', v_elapsed_seconds
    );
END;
$$;

-- Function: Increment Anti-Cheat Tab Switch Violation
CREATE OR REPLACE FUNCTION record_violation(
    p_player_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_violations INT;
    v_new_status TEXT := 'active';
BEGIN
    UPDATE players
    SET violations = violations + 1,
        last_active = NOW()
    WHERE id = p_player_id
    RETURNING violations, status INTO v_violations, v_new_status;

    -- If violations reach 2 -> Automatically eliminate player
    IF v_violations >= 2 THEN
        UPDATE players
        SET status = 'eliminated'
        WHERE id = p_player_id;
        v_new_status := 'eliminated';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'violations', v_violations,
        'status', v_new_status,
        'eliminated', (v_violations >= 2)
    );
END;
$$;

-- 8. SEED DATA - 10 SAMPLE QUESTIONS
INSERT INTO questions (answer, shuffled_letters, difficulty, points, order_index) VALUES
('AI', '["I", "A"]', 'Dễ', 100, 1),
('PROMPT', '["T", "P", "R", "M", "O", "Q"]', 'Dễ', 100, 2),
('CHATGPT', '["T", "G", "P", "C", "H", "A", "T"]', 'TB', 200, 3),
('DỮ LIỆU', '["LIỆU", "DỮ"]', 'TB', 200, 4),
('TỰ ĐỘNG HÓA', '["HÓA", "TỰ", "ĐỘNG"]', 'Khó', 300, 5),
('CÁ NHÂN HÓA', '["HÓA", "CÁ", "NHÂN"]', 'Khó', 300, 6),
('TRÍ TUỆ NHÂN TẠO', '["TẠO", "TRÍ", "TUỆ", "NHÂN"]', 'Khó', 300, 7),
('GENERATIVE AI', '["AI", "GENERATIVE"]', 'Khó', 300, 8),
('AI AGENT', '["AGENT", "AI"]', 'Khó', 300, 9),
('TƯƠNG LAI', '["LAI", "TƯƠNG"]', 'TB', 200, 10)
ON CONFLICT (order_index) DO NOTHING;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read & write for active game room players
CREATE POLICY "Allow public read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update rooms" ON rooms FOR ALL USING (true);

CREATE POLICY "Allow public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update players" ON players FOR ALL USING (true);

CREATE POLICY "Allow public read questions" ON questions FOR SELECT USING (true);

CREATE POLICY "Allow public read answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Allow public insert answers" ON answers FOR ALL USING (true);
