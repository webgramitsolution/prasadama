CREATE TABLE public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email_type text not null,
  recipient text not null,
  subject text,
  status text not null default 'sent',
  provider text not null default 'smtp',
  smtp_host text,
  smtp_port integer,
  error_message text,
  correlation_id text,
  order_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

CREATE INDEX idx_email_delivery_logs_created_at ON public.email_delivery_logs (created_at DESC);
CREATE INDEX idx_email_delivery_logs_recipient ON public.email_delivery_logs (lower(recipient));

GRANT SELECT ON public.email_delivery_logs TO authenticated;
GRANT ALL ON public.email_delivery_logs TO service_role;

ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email delivery logs"
ON public.email_delivery_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));