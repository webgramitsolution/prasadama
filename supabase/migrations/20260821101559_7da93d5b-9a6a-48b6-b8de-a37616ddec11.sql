-- 1) Internal / service-role-only or trigger-only functions: no client execution at all
REVOKE ALL ON FUNCTION public.increment_coupon_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_sms_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, jsonb, text, uuid, text, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_chat_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_order_ekart_sync() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_sms_rate_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, jsonb, text, uuid, text, numeric, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, uuid, jsonb) TO service_role;

-- 2) Admin-only functions (they already check has_role): signed-out users must not be able to call them
REVOKE ALL ON FUNCTION public.admin_order_sms_status(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_sms_credentials() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_sms_delivery_metrics(date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_signup_otp_events() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_users_with_roles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_security_audit_access(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_security_audit_access(text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_admin_config_audit(text, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_message_read(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_order_sms_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_sms_credentials() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_sms_delivery_metrics(date, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_signup_otp_events() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_users_with_roles() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_security_audit_access(text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_security_audit_access(text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_admin_config_audit(text, jsonb, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated, service_role;
