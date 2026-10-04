# Export database Labora untuk pengumpulan lomba

File yang disertakan: **[labora.sql](labora.sql)**.

DBMS: **PostgreSQL 17 melalui Supabase**, bukan MySQL. Export dibuat pada 4 Oktober 2026 menggunakan `pg_dump` PostgreSQL 17.11 dari database Supabase lokal. Tujuh versi migrasi lokal sudah dicocokkan dengan riwayat migrasi project hosted. File ini merupakan dump distribusi aplikasi dengan data katalog awal, bukan backup seluruh data produksi.

## Isi file

- Struktur 20 tabel pada schema `public` dan `private`.
- Primary key, foreign key, constraint, index, fungsi, trigger, RLS, policy, dan hak akses objek aplikasi.
- Sembilan eksperimen, sembilan versi definisi, dan sembilan kunci jawaban katalog.
- Trigger pembuatan profil pada Supabase Auth.
- Konfigurasi bucket avatar privat dan policy pembacaan avatar.

Tabel akun, sekolah, kelas, tugas, sesi, catatan, dan hasil siswa disertakan strukturnya dengan data awal kosong. Data pengguna, kredensial, token login, dan file avatar tidak diexport. Schema internal Auth dan Storage serta role bawaan disediakan oleh Supabase tujuan.

Pengaturan default privileges global milik Supabase tidak disalin; hak akses setiap objek aplikasi tetap disertakan. Dump juga menghapus default akses tabel baru untuk role `anon` dan `authenticated` sebelum membuat tabel aplikasi.

File mengandung kunci jawaban pembelajaran; simpan bersama source/backend, bukan di folder frontend `public` yang dapat diunduh langsung oleh pengunjung.

## Cara restore

1. Siapkan project Supabase baru atau lingkungan Supabase lokal baru dengan PostgreSQL 17. Schema `auth` dan `storage`, fungsi Auth/Storage, serta role `anon`, `authenticated`, dan `service_role` harus sudah tersedia.
2. Gunakan database tujuan yang belum berisi tabel Labora. **Jangan import ke database produksi yang sedang digunakan.**
3. Ambil parameter koneksi PostgreSQL dari menu **Connect** pada project tujuan. Gunakan koneksi langsung atau session pooler yang tersedia, dengan akun database `postgres`.
4. Pasang client `psql` versi 17.11 atau versi lebih baru. Dump menggunakan perintah client `\restrict`/`\unrestrict`, sehingga dijalankan melalui `psql`, bukan ditempel sebagai satu blok di SQL Editor.
5. Dari root repository, atur koneksi melalui environment lalu jalankan import.

Contoh PowerShell, seluruh nilai dalam tanda `<...>` harus diganti:

```powershell
$env:PGHOST = "<host database atau session pooler>"
$env:PGPORT = "5432"
$env:PGDATABASE = "postgres"
$env:PGUSER = "<username dari parameter Connect>"
$env:PGPASSWORD = "<password database tujuan>"
$env:PGSSLMODE = "require"

psql -X --set ON_ERROR_STOP=on --single-transaction --file backend/database/labora.sql

Remove-Item Env:PGPASSWORD
```

`ON_ERROR_STOP` menghentikan import jika terjadi error. `--single-transaction` membuat import diterapkan sebagai satu transaksi agar kegagalan tidak meninggalkan sebagian tabel.

Untuk database Supabase lokal, sesuaikan host/port dengan konfigurasi lokal dan gunakan `PGSSLMODE=disable` jika koneksi lokal tidak memakai TLS.

Dump ini adalah **alternatif** untuk memasang database menggunakan file di `backend/supabase/migrations/`. Jangan menerapkan dump dan tujuh migrasi awal ke database yang sama. Dump tidak menyertakan riwayat migrasi CLI; jika instalasi hasil dump kemudian akan dikelola dengan CLI, baseline riwayatnya perlu diselaraskan terlebih dahulu.

## Pemeriksaan setelah import

```sql
select count(*) as experiments from public.experiments; -- 9
select count(*) as versions from public.experiment_versions; -- 9
select count(*) as catalog_keys from private.answer_keys; -- 9, jalankan sebagai postgres
select count(*) as profiles from public.profiles; -- 0 pada instalasi baru

select count(*) as current_versions
from public.experiments e
join public.experiment_versions v on v.id = e.current_version_id; -- 9

select has_table_privilege('anon', 'private.answer_keys', 'SELECT'); -- false
select has_table_privilege('authenticated', 'private.answer_keys', 'SELECT'); -- false
```

Selanjutnya pasang environment aplikasi sesuai `frontend/.env.example`, atur Auth/email, dan buat akun baru melalui aplikasi. Pengaturan SMTP, Site URL, redirect URL, serta API key project tidak dibawa oleh dump SQL. Ikuti [panduan produksi](../PRODUCTION.md) untuk konfigurasi layanan tersebut.

## Hasil verifikasi export

Restore diuji dengan `psql`, `ON_ERROR_STOP`, dan satu transaksi pada database PostgreSQL 17.11 sementara yang terpisah, dengan schema framework Auth/Storage dari lingkungan Supabase lokal.

| Pemeriksaan                                         | Hasil           |
| --------------------------------------------------- | --------------- |
| Import seluruh dump                                 | Berhasil        |
| Tabel aplikasi dengan RLS                           | 20              |
| Policy aplikasi pada schema `public`/`private`      | 20              |
| Eksperimen / versi / kunci katalog                  | 9 / 9 / 9       |
| Hubungan versi aktif eksperimen                     | 9 valid         |
| Pengguna Auth / profil awal                         | 0 / 0           |
| Bucket avatar privat                                | Tersedia        |
| Trigger profil pada Auth                            | Tersedia        |
| Katalog dapat dibaca role `anon`                    | 9 eksperimen    |
| Kunci jawaban dapat dibaca `anon` / `authenticated` | Tidak           |
| RPC kunci penilaian dapat dipanggil `anon`          | Tidak           |
| RPC kunci penilaian dapat dipanggil `service_role`  | Ya              |
| Scan pola secret dan data akun pada dump            | Tidak ditemukan |

Verifikasi ini memeriksa import dan konfigurasi database; konfigurasi email/hosting pada project tujuan tetap dilakukan setelah restore.

Referensi: [dokumentasi dump Supabase CLI](https://supabase.com/docs/reference/cli/supabase-db-dump). Supabase membedakan export schema, data, dan role serta mengelola schema internalnya sendiri.
