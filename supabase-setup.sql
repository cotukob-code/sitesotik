-- Создание таблицы сообщений для чата
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT,
  surname TEXT,
  message TEXT,
  donate INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включение RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT: читают все (anon и authenticated)
CREATE POLICY "public_chat_read_all"
ON public.messages
FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: пишут все (anon и authenticated)
CREATE POLICY "public_chat_insert_all"
ON public.messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Индекс на created_at для быстрой сортировки
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Таблица донатов
CREATE TABLE IF NOT EXISTS public.donations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT,
  bank TEXT,
  amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_donations_read_all"
ON public.donations
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "public_donations_insert_all"
ON public.donations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS donations_created_at_idx ON public.donations(created_at);

-- ========== ПРОВЕРКА СТРУКТУРЫ ==========
-- 1. Посмотреть колонки таблицы:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='messages'
-- ORDER BY ordinal_position;

-- 2. Проверить политики RLS:
-- SELECT schemaname, tablename, polname, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname='public' AND tablename='messages';

-- ========== ПРИМЕР ТЕСТОВЫХ ДАННЫХ ==========
-- INSERT INTO public.messages (name, surname, message, donate)
-- VALUES ('Иван', 'Петров', 'Привет, чат!', 0);

-- INSERT INTO public.messages (name, surname, message, donate)
-- VALUES ('Мария', 'Иванова', 'Привет всем!', 100);
