CREATE POLICY "Users read own report photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload own report photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own report photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);