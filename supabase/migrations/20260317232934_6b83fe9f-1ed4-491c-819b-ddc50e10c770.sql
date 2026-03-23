
SELECT cron.schedule(
  'generate-cache-resumo-3x',
  '0 6,12,18 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://mdtbwvyloaeixwxmvysj.supabase.co/functions/v1/generate-cache-resumo',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdGJ3dnlsb2FlaXh3eG12eXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjYxMjAsImV4cCI6MjA4ODA0MjEyMH0.2RG4Uhheky2fBI9iw7hmZuRbjhRuph5cRilyVp4Wbqs"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
