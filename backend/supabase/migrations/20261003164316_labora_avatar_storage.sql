insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',false,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy labora_avatar_read on storage.objects for select to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Upload/delete are performed by the verified backend, not by the browser SDK.
