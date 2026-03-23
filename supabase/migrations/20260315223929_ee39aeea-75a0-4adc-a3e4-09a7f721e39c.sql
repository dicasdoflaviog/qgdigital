
-- Super admin (L5) full write access on tables missing explicit super_admin policies

-- audit_logs: allow super_admin UPDATE/DELETE
CREATE POLICY "Super admin can manage audit_logs"
ON public.audit_logs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- notifications: allow super_admin DELETE
CREATE POLICY "Super admin can manage notifications"
ON public.notifications FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- feedbacks: allow super_admin DELETE
CREATE POLICY "Super admin can delete feedbacks"
ON public.feedbacks FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- error_logs: allow super_admin full management
CREATE POLICY "Super admin can manage error_logs"
ON public.error_logs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- convites: allow super_admin DELETE
CREATE POLICY "Super admin can delete convites"
ON public.convites FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- assessores: explicit super_admin ALL
CREATE POLICY "Super admins can manage assessores"
ON public.assessores FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
