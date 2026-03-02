-- RecruitAI schema
-- Enable extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core tables
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  resume_url TEXT,
  parsed_resume JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  shadow_jd JSONB,
  question_script JSONB,
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  entries JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  verdict TEXT,
  category_scores JSONB,
  sentiment_analysis JSONB,
  proctoring_log JSONB,
  report_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  challenge JSONB,
  candidate_code TEXT,
  test_results JSONB,
  ai_observations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;

-- Baseline policies (owner-only by auth uid)
CREATE POLICY IF NOT EXISTS "Users can manage own candidates"
ON candidates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can access own interviews"
ON interviews
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = interviews.candidate_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = interviews.candidate_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can access own transcripts"
ON transcripts
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM interviews i
    JOIN candidates c ON c.id = i.candidate_id
    WHERE i.id = transcripts.interview_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM interviews i
    JOIN candidates c ON c.id = i.candidate_id
    WHERE i.id = transcripts.interview_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can access own reports"
ON reports
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM interviews i
    JOIN candidates c ON c.id = i.candidate_id
    WHERE i.id = reports.interview_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM interviews i
    JOIN candidates c ON c.id = i.candidate_id
    WHERE i.id = reports.interview_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can access own coding sessions"
ON coding_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM interviews i
    JOIN candidates c ON c.id = i.candidate_id
    WHERE i.id = coding_sessions.interview_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM interviews i
    JOIN candidates c ON c.id = i.candidate_id
    WHERE i.id = coding_sessions.interview_id
      AND c.user_id = auth.uid()
  )
);
