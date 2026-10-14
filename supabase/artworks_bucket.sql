-- Artes enviadas pelos clientes nos patches personalizados. Privado: sem
-- nenhuma policy, só o servidor (chave de serviço) gera links de envio e de
-- leitura, e o link de leitura só sai para o admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artworks', 'artworks', false, 20971520, array['application/pdf', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
