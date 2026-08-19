// Supabase 数据库配置 (保持原有配置不变，确保云端数据安全)
const SUPABASE_URL = "https://gbblgyxkpzkiislxtrfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiYmxneXhrcHpraWlzbHh0cmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjY1MTMsImV4cCI6MjEwMjUwMjUxM30.W8omQO5rvy167JedlMqrfmaKazUqo97wMOO8CBI4PKY";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
