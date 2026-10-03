# Labora — Product Requirements Document dan Design System

- **Versi:** 1.0
- **Tanggal:** 4 Oktober 2026
- **Dasar:** fitur, modul, aset, dan dokumentasi dalam repository Labora.
- **Tujuan:** acuan produk, desain, dan penyusunan proposal proyek.

Dokumen ini membedakan kemampuan yang sudah diimplementasikan dari sasaran pengembangan. Backend telah diverifikasi secara lokal, database remote sudah dimigrasikan, dan smoke test akses API remote telah lulus. Deployment publik dan verifikasi akun pada lingkungan produksi HTTPS masih diperlukan. Durasi eksperimen merupakan estimasi katalog, bukan pengukuran pengguna.

**Navigasi dokumen:**

- [PRD: kebutuhan, fitur, alur dan arsitektur](#bagian-i--prd)
- [Design system: warna, tipografi, layout dan komponen](#bagian-ii--design-system)
- [Acuan proposal dan sumber internal](#bagian-iii--acuan-proposal)

## Bagian I — PRD

### 1. Ringkasan produk

Labora adalah laboratorium sains virtual berbasis browser untuk membantu siswa mempelajari Kimia, Fisika, dan Biologi melalui eksperimen interaktif. Siswa dapat menggunakan alat virtual, mengubah variabel, mengamati perubahan, mengikuti instruksi, dan menjawab pertanyaan. Guru dapat menyusun tugas dari eksperimen yang tersedia serta meninjau hasil siswa.

**Prinsip pembelajaran:** “Learn science by doing, not only by reading.”

**Pesan utama:** “Sains lebih seru kalau kamu coba.”

Labora dirancang sebagai media pendamping pembelajaran dan persiapan praktikum. Simulasi memakai model pendidikan dengan batas tertentu; pengalaman ini tidak mencakup seluruh keterampilan menggunakan alat fisik atau semua kemungkinan fenomena sains.

### 2. Masalah dan peluang

Ketersediaan alat, bahan, waktu, dan ruang praktikum dapat membatasi kesempatan siswa untuk mencoba konsep sains. Penjelasan melalui teks dan gambar juga belum selalu memberi kesempatan mengubah variabel serta melihat akibatnya.

Labora menawarkan ruang percobaan yang dapat diulang melalui browser. Guru tetap dapat memberikan arahan dan penilaian, sementara siswa memperoleh umpan balik atas tindakan dan jawabannya.

**Asumsi yang perlu divalidasi dalam proposal:** kebutuhan sekolah sasaran, perangkat dan jaringan yang tersedia, kesesuaian materi dengan pembelajaran, serta manfaat terhadap pemahaman siswa. Repository belum menyediakan survei sekolah atau bukti peningkatan hasil belajar.

### 3. Pengguna sasaran

| Pengguna                                    | Kebutuhan                                                  | Dukungan produk                                                    |
| ------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Siswa SMA/MA kelas X–XII sebagai fokus awal | Mencoba konsep, memahami perubahan, mengulang latihan      | Eksperimen interaktif, tantangan terpandu, hasil dan progres       |
| Guru sains                                  | Memberikan kegiatan terarah dan mengetahui kesulitan siswa | Pembuat tugas, distribusi ke kelas, laporan dan jawaban siswa      |
| Sekolah                                     | Menambah akses terhadap media praktikum                    | Aplikasi berbasis browser dan kegiatan yang dapat disesuaikan guru |

Peran aplikasi utama adalah siswa dan guru. Penggunaan untuk jenjang lain memerlukan penyesuaian materi; keselarasan dengan seluruh kurikulum belum dinyatakan tervalidasi.

### 4. Tujuan dan indikator evaluasi

| Tujuan                                             | Indikator untuk uji coba                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Memudahkan siswa memulai percobaan                 | Keberhasilan mencapai meja eksperimen tanpa bantuan; waktu mulai        |
| Membuat hubungan tindakan dan hasil mudah dipahami | Kemampuan menjelaskan pengamatan setelah percobaan                      |
| Mendukung latihan mandiri                          | Tingkat penyelesaian, pengulangan, dan penggunaan petunjuk              |
| Membantu guru memberikan penilaian                 | Keberhasilan membuat, menerbitkan, dan meninjau tugas                   |
| Mendukung perangkat sekolah                        | Hambatan pada desktop/ponsel, kegagalan penyimpanan, kebutuhan jaringan |

Indikator di atas adalah rancangan evaluasi. Target angka dan kesimpulan efektivitas ditetapkan setelah pilot, bukan dianggap sebagai capaian produk saat ini.

### 5. Ruang lingkup dan status

| Area                   | Implementasi saat ini                                                               | Status                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Landing dan aplikasi   | Halaman publik terpisah dari shell aplikasi; tombol masuk aplikasi menuju dashboard | Tersedia                                                                |
| Laboratorium           | Kimia, Fisika, Biologi; eksplorasi dan tantangan terpandu                           | Tersedia                                                                |
| Penilaian              | Sembilan eksperimen, validasi langkah, pertanyaan, hasil dan progres                | Tersedia; backend diuji lokal                                           |
| Akun                   | Login, pendaftaran, pemulihan, profil, avatar, keluar akun                          | Tersedia; konfigurasi Auth produksi diperlukan                          |
| Tugas guru             | Draft, instruksi dan pertanyaan khusus, publikasi ke kelas, laporan dan CSV         | Tersedia; alur akun diuji lokal                                         |
| Penyimpanan            | Sesi terpandu, konfigurasi meja, catatan, notifikasi                                | Tersedia; browser catatan lintas perangkat dan ekspor telah lulus lokal |
| Infrastruktur produksi | Migrasi database, konfigurasi domain/SMTP, staging dan pemulihan                    | Belum selesai diterapkan pada lingkungan produksi                       |
| Penugasan per siswa    | Pemilihan penerima individual                                                       | Pengembangan lanjutan; publikasi saat ini berbasis kelas                |

Di luar ruang lingkup saat ini: simulator universal, sistem administrasi sekolah lengkap, pembayaran, kolaborasi langsung, proctoring, penilaian AI, serta simulasi golongan darah ABO. Eksperimen darah yang tersedia berfokus pada identifikasi jenis sel.

### 6. Dua cara belajar

**Eksplorasi:** pengguna memilih kategori dan mencoba alat atau kontrol simulasi. Label navigasinya adalah **Eksperimen**. Eksplorasi dasar dapat dibuka tanpa akun; penyimpanan lintas perangkat memerlukan akun dan backend yang dikonfigurasi.

**Tantangan terpandu:** siswa membaca tujuan dan teori, mengikuti langkah yang divalidasi, menjawab pertanyaan, lalu memperoleh hasil. Kegiatan dapat dijalankan sebagai latihan atau sebagai tugas guru.

**Mode demo** menyimpan latihan dalam browser dan terpisah dari akun sekolah. Hasil demo tidak menjadi nilai resmi kelas. Kegiatan akun memerlukan koneksi untuk autentikasi, sinkronisasi, dan penilaian server; aplikasi belum merupakan produk yang sepenuhnya dapat digunakan offline.

### 7. Katalog eksperimen terpandu

| Bidang  | Eksperimen                      | Konsep utama                                   | Estimasi |
| ------- | ------------------------------- | ---------------------------------------------- | -------- |
| Kimia   | Identifikasi Asam dan Basa      | Indikator, pH, klasifikasi larutan             | 12 menit |
| Kimia   | Reaksi Pembentukan Endapan      | Pencampuran larutan dan pengamatan endapan     | 10 menit |
| Kimia   | Pengenceran dan Konsentrasi     | Pengaruh penambahan pelarut pada konsentrasi   | 10 menit |
| Fisika  | Rangkaian Hukum Ohm             | Hubungan tegangan, hambatan, dan arus          | 15 menit |
| Fisika  | Gerak Parabola                  | Pengaruh kecepatan dan sudut terhadap lintasan | 12 menit |
| Fisika  | Bandul Sederhana                | Hubungan panjang bandul dan periode            | 10 menit |
| Biologi | Pengamatan Sel dengan Mikroskop | Preparasi dan pengamatan struktur sel          | 14 menit |
| Biologi | Transpirasi Tumbuhan            | Pelepasan uap air melalui tumbuhan             | 11 menit |
| Biologi | Identifikasi Sel Darah          | Perbedaan eritrosit, leukosit, dan trombosit   | 9 menit  |

Tiga demonstrasi utama: **Identifikasi Asam dan Basa**, **Rangkaian Hukum Ohm**, dan **Pengamatan Sel dengan Mikroskop**.

Eksplorasi tambahan yang ada dalam codebase:

- **Kimia:** penempatan alat dan bahan, pencampuran, penuangan, pengukuran, pH, pengenceran, pemanasan, dan sejumlah proses pemisahan dengan aturan simulasi yang ditentukan.
- **Fisika:** Meriam & Target, Roller Coaster Maker, Lab Kapal Selam, Sandbox Laser & Lensa, serta Rangkaian Seri & Paralel.
- **Biologi:** tujuh preparat mikroskop, yaitu darah, epidermis bawang, epitel pipi, Elodea, stomata, Paramecium, dan ragi. Kontrol mencakup pilihan preparat, objektif, fokus, dan pencahayaan.

Mikroskop menggunakan foto preparat dan visual edukatif. Perbesaran digital membantu pengamatan; hasilnya bukan pengukuran optik alat nyata. Atribusi dan lisensi foto perlu dipertahankan.

### 8. Alur utama pengguna

#### Siswa — percobaan asam dan basa

1. Membuka landing dan menekan tombol mulai untuk masuk ke dashboard aplikasi.
2. Memilih kegiatan Kimia dan eksperimen Identifikasi Asam dan Basa pada alur tantangan.
3. Membaca tujuan, teori, perlengkapan, langkah, dan estimasi durasi.
4. Memulai eksperimen dan meletakkan beaker melalui drag-and-drop atau tindakan berlabel.
5. Menambahkan larutan sesuai instruksi, lalu indikator.
6. Mengamati perubahan warna dan klasifikasi larutan; contoh larutan asam menunjukkan merah dengan estimasi pH 3.
7. Menjawab pertanyaan, membaca penjelasan, dan menyelesaikan kegiatan.
8. Membuka hasil dan progres. Untuk akun nyata, penilaian disimpan oleh backend.

#### Siswa — eksplorasi

Dashboard → Eksperimen → pilih Kimia/Fisika/Biologi → pilih kegiatan atau simulasi → ubah alat/variabel → amati → catat atau simpan konfigurasi bila tersedia.

#### Guru — tugas kelas

1. Masuk dengan akun guru dan keanggotaan yang sesuai.
2. Memilih eksperimen dari katalog.
3. Menulis judul dan instruksi; menyesuaikan petunjuk serta pertanyaan pada tahap yang disediakan.
4. Menentukan opsi jawaban, jawaban benar, dan penjelasan untuk tahap pertanyaan.
5. Menyimpan draft, memilih kelas dan tenggat, lalu menerbitkan tugas.
6. Siswa penerima mengerjakan kegiatan; guru meninjau penyelesaian, nilai, dan jawaban, atau mengekspor laporan.

Guru memakai alur aksi eksperimen yang sudah disediakan. Builder saat ini tidak menawarkan pemrograman simulasi, penyusunan aksi ilmiah arbitrer, atau bobot nilai bebas.

### 9. Kebutuhan fungsional dan kriteria penerimaan

| ID    | Kebutuhan                             | Kriteria penerimaan                                                                                              |
| ----- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| FR-01 | Pemisahan halaman publik dan aplikasi | CTA masuk aplikasi dari landing menuju `/dashboard`; login/daftar memiliki halaman sendiri                       |
| FR-02 | Pilihan laboratorium                  | Tiga kategori terlihat jelas, memiliki identitas subjek, dan membuka kegiatan yang relevan                       |
| FR-03 | Persiapan eksperimen                  | Detail memuat tujuan, teori, peralatan/bahan, langkah, durasi, dan tombol mulai                                  |
| FR-04 | Manipulasi alat                       | Tindakan yang didukung mengubah state; tersedia jalur klik selain drag pada aktivitas yang sesuai                |
| FR-05 | Validasi langkah                      | Tindakan tepat tercatat; tindakan tidak sesuai memberi penjelasan tanpa merusak sesi                             |
| FR-06 | Visualisasi                           | Warna/cairan, arus/lintasan, atau pengamatan sel mengikuti model dan kontrol kegiatan                            |
| FR-07 | Pertanyaan dan feedback               | Pilihan jawaban, kebenaran, jumlah percobaan, dan penjelasan dapat ditampilkan/disimpan                          |
| FR-08 | Hasil dan progres                     | Hasil memuat nilai, akurasi, langkah, dan ulasan konsep; status selesai terpisah dari CTA                        |
| FR-09 | Akun dan peran                        | Identitas diverifikasi server; akses guru ditentukan keanggotaan database                                        |
| FR-10 | Tugas guru                            | Draft dapat disimpan; publikasi membekukan versi kegiatan dan daftar siswa penerima dari kelas                   |
| FR-11 | Laporan                               | Guru yang berwenang melihat penyelesaian dan hasil penerima; ekspor mencakup seluruh halaman laporan             |
| FR-12 | Simpan dan lanjutkan                  | Akun dapat melanjutkan sesi; konflik versi tidak menimpa pekerjaan perangkat lain secara diam-diam               |
| FR-13 | Bantuan dan profil                    | Bantuan, notifikasi, dan menu profil membuka overlay; Settings menyediakan pengaturan dan logout                 |
| FR-14 | Responsivitas                         | Halaman dapat dipakai pada desktop/ponsel; inventori sandbox mobile berada di bawah meja dengan gulir horizontal |

Kriteria ini menjadi acuan regresi dan release. Keberadaan implementasi tidak berarti seluruh lingkungan produksi telah memenuhi setiap pemeriksaan.

### 10. Penilaian

Nilai total akun dihitung server:

**Nilai = pembulatan (40% × akurasi eksperimen + 60% × akurasi kuis).**

- Akurasi eksperimen mempertimbangkan aksi ilmiah yang diperlukan dan percobaan tindakan; tahap pertanyaan tidak dihitung sebagai aksi ilmiah kedua.
- Akurasi kuis mengikuti proporsi jawaban benar pada pertanyaan kegiatan.
- Pengiriman hasil memerlukan kelengkapan langkah dan jawaban serta akses tugas yang masih sah.
- Satu attempt menghasilkan satu hasil final yang tidak diubah; pengiriman ulang mengembalikan hasil yang sama.
- Tugas saat ini mengizinkan pengulangan hingga tenggat. Laporan guru memakai nilai terbaik dari attempt yang selesai.
- Rumus latihan demo lokal dapat berbeda dalam penghitungan akurasi; nilai resmi kelas berasal dari backend.

Pertanyaan disajikan melalui opsi jawaban. Bentuk benar/salah atau prediksi dapat ditulis sebagai pilihan jawaban; ini belum merupakan editor penilaian esai atau jenis soal arbitrer.

### 11. Peta halaman

| Halaman               | Rute utama                                     | Tujuan                                                             |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| Landing               | `/`                                            | Penjelasan manfaat dan akses awal aplikasi                         |
| Login / register      | `/login`, `/register`                          | Akun atau akses demo                                               |
| Dashboard             | `/dashboard`                                   | Titik masuk, rekomendasi, lanjutkan dan ringkasan                  |
| Pilihan kategori      | `/laboratories`                                | Tiga kategori; `/experiments` memakai halaman pilihan yang sama    |
| Eksplorasi subjek     | `/kimia`, `/fisika`, `/laboratories/{subject}` | Daftar kegiatan atau meja subjek                                   |
| Tantangan             | `/challenges`                                  | Katalog eksperimen terpandu                                        |
| Detail                | `/experiments/{id}`                            | Persiapan sebelum kegiatan                                         |
| Laboratorium terpandu | `/challenges/run/{id}`                         | Interaksi, instruksi dan pertanyaan                                |
| Hasil / progres       | `/results/{id}`, `/progress`                   | Hasil latihan dan riwayat; hasil akun juga diakses melalui progres |
| Tugas siswa           | `/assignments`                                 | Kegiatan yang diberikan guru                                       |
| Ruang guru            | `/teacher`                                     | Draft, tugas dan laporan                                           |
| Pembuat tugas         | `/teacher/new`                                 | Konfigurasi kegiatan kelas                                         |
| Hasil tugas guru      | `/teacher/results/{id}`                        | Penyelesaian, nilai, jawaban dan ekspor laporan                    |
| Settings              | `/settings`                                    | Profil, preferensi, keanggotaan dan keluar akun                    |

Kode subjek pada rute kategori adalah `chemistry`, `physics`, atau `biology`. Rute kompatibilitas tetap ada; tabel menampilkan tujuan produk utama, bukan seluruh endpoint.

### 12. Arsitektur dan data

Labora menggunakan **modular monolith**: satu aplikasi deployment Next.js, dengan modul produk yang memiliki tanggung jawab jelas. Folder frontend dan backend terpisah, sedangkan kontrak bersama diakses melalui path aliases.

```text
Browser / React
    → API /api/v1 dalam deployment Next.js
    → Modul backend sesuai fitur
    → Supabase Auth, PostgreSQL, dan Storage

Mesin simulasi lokal → visual SVG / Canvas / CSS
```

| Bagian              | Tanggung jawab                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| `frontend/`         | Halaman, shell aplikasi, fitur UI, kontrol dan visual simulasi, aset `public/` |
| `backend/modules/`  | Identitas, kelas, katalog, sesi, penilaian, tugas, catatan dan notifikasi      |
| `backend/supabase/` | Migrasi, seed, kebijakan akses dan konfigurasi database lokal                  |
| `shared/`           | Kontrak API/DTO dan engine eksperimen terpandu yang dapat digunakan bersama    |

Stack aktual: **Next.js 15, React 19, TypeScript, CSS, dnd-kit, Lucide, dan Supabase**. State UI memakai hooks/reducer React; perhitungan ilmiah dipisahkan dari komponen visual. Tidak ada kebutuhan deployment microservices atau folder packages monorepo dalam arsitektur saat ini.

Data utama terdiri dari profil; sekolah/kelas/keanggotaan/undangan; eksperimen dan versi; sesi, aksi, jawaban dan hasil; tugas, versi dan penerima; catatan serta notifikasi. Kunci jawaban dan data pembatasan permintaan berada dalam skema privat.

Versi eksperimen dan tugas dipertahankan supaya hasil lama tetap merujuk materi yang dikerjakan. Frontend akun memanggil API; kredensial berhak tinggi, otorisasi, dan penilaian resmi berada di server. Detail tabel dan migrasi ada pada [dokumentasi backend](backend/README.md).

### 13. Kebutuhan kualitas

- **Ketepatan pendidikan:** setiap kegiatan memiliki tujuan dan model terbatas yang dapat diperiksa. Perlu review guru sebelum klaim kesesuaian kurikulum atau akurasi alat nyata.
- **Ketahanan interaksi:** tindakan tidak valid memberikan feedback; reset dan retry tersedia sesuai kegiatan.
- **Aksesibilitas:** label, fokus keyboard, jalur tanpa drag, status berbasis teks, dan dukungan reduced motion. Kepatuhan menyeluruh terhadap WCAG AA merupakan target audit, bukan sertifikasi saat ini.
- **Keamanan:** cookie autentikasi terverifikasi, otorisasi keanggotaan, RLS, kunci jawaban privat, batas request, validasi asal mutasi, dan avatar privat.
- **Konsistensi data:** event idempotent, revisi sesi, hasil final tetap, serta pemisahan demo dan akun. UI perlu menunjukkan proses simpan, kegagalan dan konflik.
- **Kinerja:** loop animasi berjalan lokal; penyimpanan memakai konfigurasi bermakna, bukan tiap frame. Batas perangkat minimum dan metrik kinerja perlu ditetapkan melalui uji perangkat sekolah.
- **Operasional:** backup, konfigurasi domain/Auth/SMTP, staging, monitoring dan prosedur pemulihan diperlukan sebelum penggunaan produksi.

### 14. Roadmap dan syarat rilis

Pembagian fase mengikuti [implementation plan](backend/IMPLEMENTATION_PLAN.md): **fase 0–4 = V1**, **fase 5–7 = V2**. Estimasi awal adalah 11–15 hari engineering untuk V1 dan tambahan 8–12 hari untuk V2; ini perkiraan perencanaan awal, bukan janji waktu tersisa atau bukti tanggal rilis.

- **V1:** fondasi API, akun dan keanggotaan, katalog versi, sesi terpandu, penilaian, progres serta penyimpanan dasar.
- **V2:** tugas guru dan laporan, integrasi catatan/notifikasi/avatar dan simpan per subjek, migrasi data lama serta kesiapan operasional.
- **Status snapshot:** sebagian besar implementasi V1/V2 tersedia dan diuji lokal. Inventaris remote menunjukkan tidak ada data lama; enam migrasi telah diterapkan. Secret server, katalog/API remote, RLS dan pembatasan akses anonim telah diperiksa. Browser pertanyaan/penjelasan guru, CSV dan notebook lintas perangkat telah lulus lokal.
- **Pekerjaan tersisa:** konfigurasi Auth/SMTP/domain dan hosting, deployment aplikasi HTTPS, verifikasi staging akun serta operasional. Penargetan penerima individual belum tersedia.

Build produksi dan pemeriksaan lokal tidak boleh diterjemahkan sebagai “sudah berjalan di produksi”. Dalam proposal, gunakan “telah dikembangkan dan diverifikasi lokal, dengan tahap deployment dan pilot berikutnya”.

## Bagian II — Design System

### 15. Overview

Desain mengacu pada [designSystem.md](designSystem.md), kemudian mencerminkan implementasi pada stylesheet dan [DESIGN.md](DESIGN.md). Bila panduan awal berbeda dari fitur terbaru, gunakan perilaku dan token aktual yang dijelaskan di bawah.

Karakter visual: **bersih, ilmiah, ramah, dan interaktif**. Struktur dan keterbacaan menjadi dasar; warna cerah, bentuk membulat, dan maskot memberi kehangatan. Meja eksperimen tetap menjadi pusat perhatian.

Landing menjelaskan produk. Aplikasi memakai shell navigasi sendiri. Warna subjek membantu orientasi, sementara formulir, tabel, dan Settings menggunakan permukaan netral.

### 16. Colors

| Peran                 | Nilai                 | Penggunaan                       |
| --------------------- | --------------------- | -------------------------------- |
| Background            | `#F8FBFF`             | Latar halaman                    |
| Surface               | `#FFFFFF`             | Formulir, panel, isi kartu       |
| Ink                   | `#1F2430`             | Teks utama dan tombol cerah      |
| Muted                 | `#4C546A`             | Deskripsi dan informasi sekunder |
| Line                  | `#DDE5F0`             | Batas permukaan                  |
| Control border        | `#76859A`             | Batas input dan kontrol          |
| Chemistry / primary   | `#5EC8FF`             | Kartu Kimia dan CTA utama        |
| Chemistry light / ink | `#EAF9FF` / `#155C7B` | Panel ringan dan teks subjek     |
| Physics               | `#FFD84D`             | Kartu Fisika                     |
| Physics light / ink   | `#FFF9DB` / `#695000` | Panel ringan dan teks subjek     |
| Biology               | `#7ED957`             | Kartu Biologi                    |
| Biology light / ink   | `#F1FCEB` / `#365F27` | Panel ringan dan teks subjek     |
| Pink                  | `#FF78B8`             | Aksen pendukung merek            |
| Completed             | `#00AC3D`             | Centang eksperimen selesai       |

Fisika memakai **kuning**. Teks pada bidang biru, kuning, atau hijau cerah memakai tinta gelap yang sesuai; teks putih pada warna tersebut tidak menjadi aturan default.

Status selalu disertai label atau ikon yang dapat dikenali. Warna pengamatan ilmiah mengikuti hasil simulasi, bukan dipaksa mengikuti warna kategori.

### 17. Typography

| Peran          | Font dan ukuran                       | Karakter                           |
| -------------- | ------------------------------------- | ---------------------------------- |
| Hero landing   | Fredoka, `clamp(3rem, 4.8vw, 4.5rem)` | Weight 500, line-height 1.08       |
| Judul halaman  | Fredoka, `clamp(2rem, 3vw, 3rem)`     | Weight 500, line-height 1.2        |
| Judul bagian   | Fredoka, `clamp(1.5rem, 2.3vw, 2rem)` | Weight 500                         |
| Judul kecil    | Fredoka, `1.25rem`                    | Weight 500                         |
| Isi            | Nunito Sans, `16px`                   | Weight 400, line-height 1.6        |
| Label / tombol | Nunito Sans                           | Weight 700–800; tombol utama 800   |
| Metadata       | Nunito Sans, sekitar `14px`           | Durasi, subjek, informasi tambahan |

Heading menggunakan tracking sekitar `-0.02em`. Font fallback adalah sans-serif. Penekanan tebal diberikan pada tindakan dan informasi penting, dengan panjang kalimat ringkas agar instruksi mudah dipahami.

### 18. Layout

- **Landing:** wadah maksimum 1280px; teks dan ilustrasi/preview membentuk hirarki yang jelas. Semua CTA yang membuka aplikasi berawal dari dashboard.
- **Sidebar desktop:** rail 88px; terbuka 240px, atau 210px pada lebar di bawah 1150px. Hover/fokus membuka; klik opsi mempertahankan terbuka; klik area utama menciutkan. Sidebar menimpa halaman pada z-layer lebih tinggi, tanpa menggeser isi.
- **Header aplikasi:** bantuan, notifikasi dan profil. Panel kanan serta menu profil merupakan overlay dengan tombol tutup dan isi yang dapat digulir.
- **Pilihan kategori:** tiga kartu besar setara pada desktop. Kartu memakai warna subjek tegas, maskot dan deskripsi singkat. Pada layar sempit susunan menyesuaikan ruang baca.
- **Meja desktop:** visual dan instruksi di area utama; inventori di kanan. Proporsi konseptual sekitar 75%/25%, dengan lebar inventori mengikuti kebutuhan layar.
- **Navigasi mobile:** sampai 900px menggunakan tab bawah sesuai peran dengan ruang safe area.
- **Inventori sandbox mobile:** sampai 760px tampil langsung di bawah meja; toggle Alat/Bahan dan kartu yang digulir horizontal. Jalur ini berbeda dari inventori tantangan terpandu yang masih memakai drawer pada layar sempit.
- **Halaman kecil:** sampai 650px sebagian besar grid menjadi satu kolom dengan padding sisi 16px. Kontrol khusus Fisika/mikroskop menyesuaikan modul masing-masing.

Ritme jarak memakai 8, 12, 16, 20, 24, 32, 40, dan 64px. Jarak mengikuti keterkaitan informasi: label dekat kontrol, bagian berbeda diberi ruang lebih besar.

### 19. Elevation & Depth

Kartu kategori dan rekomendasi mendapat bayangan agar tampak dapat dipilih. Permukaan informasi sederhana memakai garis tipis. Sidebar yang terbuka dan panel kanan memiliki bayangan untuk menandai lapisan overlay.

Contoh bayangan aktual:

```css
/* Kartu kategori */
box-shadow: 0 8px 20px rgb(31 36 48 / 12%);
/* Rekomendasi */
box-shadow: 0 10px 24px rgb(31 36 48 / 12%);
/* Sidebar terbuka */
box-shadow: 12px 0 32px rgb(31 36 48 / 12%);
```

### 20. Shapes

| Elemen             | Radius acuan         |
| ------------------ | -------------------- |
| Badge              | 8px                  |
| Input              | 12px                 |
| Item navigasi      | 14px                 |
| Tombol             | 16px                 |
| Panel              | 20px                 |
| Kartu              | 24px                 |
| Rekomendasi / hero | 28–32px              |
| Avatar / pill      | Lingkaran atau 999px |

Batas permukaan umumnya 1px. Lingkaran dipakai untuk avatar dan bidang mikroskop; kontrol tetap mengikuti bentuk yang sesuai fungsinya.

### 21. Components

#### Tombol dan input

- Tombol utama berwarna biru dengan teks gelap, minimum tinggi 48px; varian kecil minimum 44px dan besar 56px. Beberapa kontrol inventori compact memiliki aturan ukuran khusus.
- Tombol ghost putih dengan batas kontrol. Hover mengangkat 1px; press menggunakan skala 0.98, transisi sekitar 180ms.
- Fokus keyboard memakai outline 3px `#155C7B` dengan offset 4px.
- Input memiliki label yang jelas. Error ditulis dekat kontrol, menyebut masalah dan cara memperbaikinya.
- Tindakan memakai kata konkret: Letakkan, Tuangkan, Tambahkan, Hubungkan, Luncurkan, atau Amati.

#### Kartu dan navigasi

- Kartu kategori menggabungkan maskot, judul, pertanyaan pemantik dan CTA; teks subjek tebal dengan tinta sesuai tema.
- Kartu eksperimen menampilkan preview, kategori, durasi, judul dan aksi. Selesai ditandai centang besar hijau terang di kanan atas, terpisah dari “Lihat eksperimen”.
- Kartu rekomendasi mengikuti warna bidang eksperimennya.
- Navigasi aktif memakai latar biru muda dan label aksesibel. Label kategori pada navigasi tetap singkat: **Eksperimen**.
- Sidebar tidak memiliki tombol expand/minimize atau kotak teks motivasi tambahan.

#### Inventori dan meja

- Alat/bahan diberi nama, ikon atau visual objek, state terpilih dan hover.
- Drag menampilkan konteks target; klik dan tindakan berlabel menyediakan alternatif pada aktivitas yang mendukungnya.
- Feedback menjelaskan tindakan berikutnya. Contoh: “Gunakan beaker untuk menampung larutan.”
- Visual menunjukkan perubahan yang bermakna: cairan, indikator, arus, lintasan, pengamatan sel atau nilai pengukuran.
- Instruksi menampilkan tahap aktif, petunjuk, dan tindakan lanjut/reset sesuai state; penyelesaian tidak hanya bergantung pada tombol Next.

#### State data

Bedakan loading, kosong, berhasil, gagal, dan konflik. Saat penyimpanan berlangsung, tampilkan status dan cegah pengiriman ganda. Saat jaringan gagal, berikan retry serta kejelasan bahwa data belum tersinkron. Jangan mengubah kegagalan akun menjadi keberhasilan demo.

### 22. Aset, ikon, motion dan bahasa

| Aset           | Lokasi relatif di `frontend/public/` | Penggunaan                     |
| -------------- | ------------------------------------ | ------------------------------ |
| Logo           | `logo/logo.png`                      | Identitas aplikasi dan favicon |
| Singa          | `mascot/lion_chemistry.png`          | Kategori Kimia                 |
| Gajah          | `mascot/physics_elephant.png`        | Kategori Fisika                |
| Kucing         | `mascot/biology_cat.png`             | Kategori Biologi               |
| Preview Fisika | `physics-previews/`                  | Thumbnail lima simulasi        |

Ikon menggunakan **Lucide**. Peralatan dan visual simulasi dibuat dengan SVG, Canvas atau CSS. Foto preparat memiliki metadata atribusi/lisensi pada modul mikroskop; pertahankan kredit saat memakai atau mengekspor aset tersebut.

Motion singkat membantu menjelaskan aksi, perubahan cairan, fokus, dan perpindahan objek. Sidebar memakai transisi sekitar 280ms. Hormati `prefers-reduced-motion`; hasil dan instruksi tetap terbaca ketika animasi dibatasi.

Bahasa UI memakai Bahasa Indonesia yang ramah dan langsung. Gunakan istilah sains secara konsisten, sebut satuan, dan hindari menyalahkan siswa. Contoh: “Belum tepat. Coba perhatikan hubungan tegangan dan hambatan.”

### 23. Do's and Don'ts

**Lakukan:**

- Pertahankan palet subjek, Fredoka/Nunito Sans, logo dan maskot yang tersedia.
- Prioritaskan meja, instruksi dan hasil pengamatan dalam hirarki.
- Sediakan label teks, fokus keyboard dan jalur selain drag.
- Gunakan shadow dan warna kuat pada permukaan yang membantu navigasi.
- Jelaskan asumsi, satuan dan batas model ilmiah ketika relevan.

**Hindari:**

- Klaim bahwa semua percobaan atau alat sudah disimulasikan secara lengkap.
- Warna sebagai satu-satunya pembeda status, atau teks putih default pada bidang cerah.
- Sidebar/panel kanan yang menggeser konten ketika terbuka.
- Inventori sandbox ponsel yang tersembunyi sebagai satu-satunya akses alat/bahan.
- Tombol dekoratif, status selesai bercampur dengan aksi, dan klaim penilaian resmi dari data demo.

## Bagian III — Acuan proposal

### 24. Ringkasan yang dapat digunakan

> Labora merupakan aplikasi laboratorium sains virtual berbasis browser yang menyediakan kegiatan Kimia, Fisika, dan Biologi untuk siswa. Melalui penggunaan alat virtual, perubahan variabel, pengamatan hasil, serta pertanyaan terpandu, aplikasi ini dirancang untuk mendukung pembelajaran sains melalui pengalaman mencoba. Guru dapat menyusun tugas dari katalog eksperimen dan meninjau hasil siswa. Pengembangan saat ini telah mencakup sembilan eksperimen terpandu dan ruang eksplorasi tambahan, dengan tahap berikutnya berupa deployment, validasi materi, dan uji coba bersama sekolah.

### 25. Susunan proposal yang disarankan

1. **Latar belakang:** masalah sekolah sasaran, dilengkapi hasil wawancara/survei sendiri.
2. **Tujuan dan penerima manfaat:** bagian 3–4 dokumen ini.
3. **Solusi dan fitur:** bagian 5–10; jelaskan perbedaan eksplorasi dan tugas terpandu.
4. **Metode pengembangan:** modular monolith, engine eksperimen, pengujian dan review guru.
5. **Rancangan tampilan:** bagian II dan screenshot aplikasi aktual.
6. **Rencana implementasi:** deployment, pilot sekolah, pelatihan singkat guru, evaluasi dan iterasi.
7. **Anggaran:** estimasi hosting, layanan database/email, perangkat bila diperlukan, pengembangan dan pelaksanaan pilot berdasarkan kebutuhan nyata.
8. **Evaluasi:** indikator bagian 4; pisahkan target, metode pengukuran dan hasil yang kelak diperoleh.

Nama sekolah mitra, biaya, jadwal pilot, kesesuaian kurikulum, dan angka dampak belum ditetapkan oleh codebase. Isilah berdasarkan data proyek yang benar-benar tersedia.

### 26. Sumber internal

- [README proyek](README.md) — penjelasan singkat dan cara menjalankan.
- [Panduan desain awal](designSystem.md) dan [design system implementasi](DESIGN.md).
- [Arsitektur](ARCHITECTURE.md) — batas modul dan arah dependency.
- [Backend](backend/README.md) dan [implementation plan](backend/IMPLEMENTATION_PLAN.md) — konfigurasi, migrasi, fase dan release gates.
- [Definisi katalog](backend/modules/catalog/definitions.ts) — sembilan eksperimen.
- [Penilaian server](backend/modules/assessment/index.ts) — perhitungan hasil resmi.
- [Stylesheet utama](frontend/app/styles.css), [shell/mobile](frontend/app/app-shell.css), dan [sandbox](frontend/app/sandbox.css).
- [Katalog Fisika](frontend/features/laboratory/subjects/physics/simulations/ui/Simulations.tsx) dan [preparat mikroskop](frontend/features/laboratory/subjects/biology/microscope.ts).
