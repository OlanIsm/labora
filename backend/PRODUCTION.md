# Rilis produksi Labora

Backend berjalan bersama Next.js dalam satu deployment Node. Folder `backend/` memisahkan modul aplikasi; bukan server HTTP kedua. `frontend/app/api/v1/` adalah adapter API untuk modul tersebut.

## Status

Kode dan migrasi diverifikasi lokal. Supabase remote sudah terpasang. Rilis publik belum selesai: akun hosting, URL HTTPS, SMTP, pengujian email dan pengujian akun pada deployment masih diperlukan. Jangan mencentang gate di bawah sebelum ada bukti.

## Hosting

Jika menggunakan Vercel, import repository GitHub Labora dengan pengaturan berikut:

| Pengaturan                                  | Nilai                                                         |
| ------------------------------------------- | ------------------------------------------------------------- |
| Framework                                   | Next.js                                                       |
| Root Directory                              | `frontend`                                                    |
| Include source files outside Root Directory | Aktif, karena aplikasi mengimpor `../backend` dan `../shared` |
| Install Command                             | `npm ci`                                                      |
| Build Command                               | `npm run build`                                               |
| Output Directory                            | Default Next.js                                               |
| Production Branch                           | `main`                                                        |

Pengaturan sumber di luar root didokumentasikan pada [Vercel Monorepos FAQ](https://vercel.com/docs/monorepos/monorepo-faq). Repository memakai path aliases; tidak membutuhkan packages workspace.

Untuk provider lain, build harus menyertakan seluruh repository, menjalankan instalasi/build dari `frontend/`, lalu menyediakan server Node melalui `npm run start`. Static export tidak menjalankan API backend.

## Environment server

Isi melalui dashboard hosting atau secret manager, bukan file yang di-commit.

| Variable                   | Nilai                                                                         |
| -------------------------- | ----------------------------------------------------------------------------- |
| `SUPABASE_URL`             | Origin project: `https://cidyenmlvuqciymnqzii.supabase.co`, tanpa `/rest/v1/` |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key project yang sama                                             |
| `SUPABASE_SECRET_KEY`      | Secret key khusus server; jangan gunakan prefix `NEXT_PUBLIC_`                |
| `APP_URL`                  | Origin HTTPS canonical aplikasi, tanpa path                                   |
| `TRUST_PROXY`              | Untuk proxy selain Vercel, set `1` hanya jika ingress menimpa `X-Real-IP`     |

Jangan set `LABORA_DIST_DIR` pada deployment: itu hanya untuk isolasi build lokal. Pisahkan Preview dan Production environments. Preview yang menjalankan pengujian mutasi harus memakai project staging tersendiri, bukan database sekolah produksi.

## Supabase Auth dan email

1. Set Site URL ke `APP_URL` produksi.
2. Allowlist callback exact `${APP_URL}/api/v1/auth/confirm` dan `${APP_URL}/api/v1/auth/confirm?recovery=1`.
3. Aktifkan email confirmation dan konfigurasi SMTP dengan domain pengirim terverifikasi.
4. Periksa template email confirmation/recovery mengikuti flow redirect/PKCE aplikasi. Uji tautan email yang benar-benar terkirim, termasuk parameter `recovery=1`.
5. Uji register, konfirmasi email, login, reload session, lupa password, ganti password dan sign out pada HTTPS.

Cookie produksi memakai Secure dan HTTP-only. Pengujian development HTTP tidak menggantikan pengujian HTTPS.

## Database dan rollback

Gunakan migrasi committed di `supabase/migrations/`; jangan menjalankan `schema.sql` legacy atau reset remote. Catat version/name sebelum dan sesudah deployment. Jika migrasi dijalankan lewat MCP, selaraskan timestamp riwayat dengan versi file agar CLI tidak memutar ulang migrasi yang sama.

Sebelum perubahan data/schema selanjutnya, verifikasi backup sesuai paket Supabase dan lakukan latihan restore pada project terpisah. Backup database tidak otomatis membuktikan pemulihan objek Storage; verifikasi avatar privat juga. Simpan identitas backup dan hasil restore, tanpa mencatat credential.

Rollback aplikasi memakai build/commit sebelumnya yang kompatibel dengan database. Migrasi penerima individual mempertahankan panggilan publikasi kelas melalui parameter opsional. Data penilaian dan versi tugas tetap immutable; koreksi database dilakukan lewat migrasi maju yang ditinjau.

## Gate rilis

| Selesai | Gate                     | Bukti yang harus dicatat                                                        |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| ☐       | Hosting dan domain HTTPS | Provider, deployment URL, commit SHA                                            |
| ☐       | Environment produksi     | Key server terpasang; tidak muncul di bundle browser                            |
| ☐       | Auth dan SMTP            | Email confirmation/reset terkirim dan tautan berhasil                           |
| ☐       | Smoke API HTTPS          | Auth config aktif; katalog 9 eksperimen; anonymous `/me` ditolak 401            |
| ☐       | Akun siswa dan guru      | Tugas kelas/individual, siswa lain ditolak, resume, kuis, skor, laporan dan CSV |
| ☐       | Persistensi              | Login perangkat kedua; progres, konfigurasi eksperimen dan notebook tersimpan   |
| ☐       | Operasional              | Log request ID tanpa secret; advisor dicek; backup/restore diverifikasi         |
| ☐       | Release                  | Pemilik rilis, tanggal, rollback commit dan hasil smoke dicatat                 |

Suite `tests/backend-integration.test.ts` dan `tests/account-flow.browser.cjs` sengaja menolak Supabase remote. Gunakan akun staging terkontrol untuk gate HTTPS; jangan melepas guard fixture tersebut.
