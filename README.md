# Labora

**Laboratorium sains virtual untuk belajar melalui eksperimen.**

Labora adalah aplikasi berbasis browser yang membantu siswa mencoba konsep **Kimia, Fisika, dan Biologi** melalui alat virtual, simulasi, pengamatan, dan pertanyaan terpandu. Guru dapat memberikan tugas eksperimen serta meninjau penyelesaian dan hasil siswa.

Prinsip produk: **“Learn science by doing, not only by reading.”**

Untuk menyusun proposal, mulai dari [labora.md](labora.md). Dokumen tersebut memuat **PRD, design system, ruang lingkup, alur pengguna, status implementasi, serta panduan proposal** berdasarkan codebase ini.

## Mengapa Labora dibuat?

Kesempatan praktikum dapat dibatasi oleh ketersediaan alat, bahan, ruang, dan waktu. Siswa juga membutuhkan kesempatan untuk mengubah variabel dan melihat akibatnya, selain membaca penjelasan.

Labora menyediakan ruang percobaan yang dapat diulang melalui browser. Produk ini dirancang sebagai pendamping pembelajaran dan persiapan praktikum. Model simulasi memiliki batas; manfaat belajar dan kesesuaian materi perlu divalidasi bersama guru serta sekolah sasaran.

## Siapa penggunanya?

- **Siswa:** fokus awal SMA/MA kelas X–XII, untuk eksplorasi, latihan, tugas dan pengamatan konsep sains.
- **Guru:** untuk menyusun kegiatan dari eksperimen yang tersedia, memberikan arahan dan meninjau hasil.
- **Sekolah:** sebagai calon pengguna media pendamping praktikum, terutama ketika akses kegiatan fisik terbatas.

## Apa yang bisa dilakukan?

### Eksperimen dan eksplorasi

Pengguna memilih Kimia, Fisika, atau Biologi, kemudian mencoba alat atau kontrol yang relevan. Perubahan tindakan dan variabel menghasilkan perubahan visual serta pengukuran sesuai model kegiatan.

- **Kimia:** meja alat/bahan, penuangan, pencampuran, indikator pH, pengenceran, pemanasan, pengukuran dan catatan.
- **Fisika:** lima ruang simulasi tambahan — Meriam & Target, Roller Coaster Maker, Lab Kapal Selam, Sandbox Laser & Lensa, serta Rangkaian Seri & Paralel.
- **Biologi:** mikroskop dengan tujuh preparat — darah, bawang, pipi, Elodea, stomata, Paramecium dan ragi — serta kontrol pengamatan.

### Tantangan terpandu

Siswa membaca konsep, mengikuti langkah eksperimen yang divalidasi, menjawab pertanyaan, menerima penjelasan, lalu melihat hasil dan progres. Interaksi menyediakan tindakan berlabel selain drag-and-drop pada kegiatan yang mendukungnya.

| Kimia                       | Fisika              | Biologi                         |
| --------------------------- | ------------------- | ------------------------------- |
| Identifikasi Asam dan Basa  | Rangkaian Hukum Ohm | Pengamatan Sel dengan Mikroskop |
| Reaksi Pembentukan Endapan  | Gerak Parabola      | Transpirasi Tumbuhan            |
| Pengenceran dan Konsentrasi | Bandul Sederhana    | Identifikasi Sel Darah          |

Tiga demonstrasi utama adalah **asam/basa, Hukum Ohm, dan mikroskop**. Identifikasi sel darah berfokus pada jenis sel, bukan simulasi golongan darah ABO.

### Tugas dan penilaian guru

Guru memilih eksperimen, membuat draft tugas, menyesuaikan instruksi serta pertanyaan pada tahap yang tersedia, lalu menerbitkannya ke seluruh kelas atau siswa tertentu. Laporan menampilkan penyelesaian dan hasil siswa, dengan ekspor CSV.

Nilai akun dihitung server dengan bobot **40% akurasi eksperimen dan 60% akurasi kuis**. Hasil final dipertahankan per attempt; laporan tugas menggunakan nilai terbaik dari pengerjaan yang selesai.

### Akun dan pengalaman aplikasi

Dashboard menjadi titik masuk aplikasi. Navigasi desktop menggunakan sidebar yang dapat terbuka sebagai overlay tanpa menggeser halaman. Bantuan, notifikasi, profil, Settings dan logout tersedia dalam shell aplikasi.

Mode demo menggunakan penyimpanan browser. Akun yang terhubung backend mendukung penyimpanan sesi, progres, konfigurasi simulasi, catatan, serta kegiatan kelas. Data demo terpisah dari nilai resmi sekolah; akun dan sinkronisasi memerlukan jaringan.

## Contoh demonstrasi

1. Buka landing dan tekan tombol mulai untuk masuk ke dashboard.
2. Pilih tantangan **Identifikasi Asam dan Basa**, lalu baca tujuan dan teorinya.
3. Mulai eksperimen, letakkan beaker, tambahkan larutan dan indikator sesuai instruksi.
4. Amati cairan berubah merah dengan estimasi **pH 3 — asam** pada contoh larutan.
5. Jawab pertanyaan tentang perubahan warna dan baca penjelasannya.
6. Selesaikan kegiatan untuk melihat nilai, pengamatan dan progres.

## Ringkasan untuk proposal

> Labora merupakan laboratorium sains virtual berbasis browser yang dirancang untuk memperluas kesempatan siswa melakukan kegiatan eksperimen. Aplikasi menyediakan ruang eksplorasi Kimia, Fisika, dan Biologi, sembilan eksperimen terpandu, serta fasilitas tugas dan penilaian bagi guru. Siswa dapat memanipulasi alat virtual, mengamati hasil, dan menerima umpan balik. Pengembangan saat ini telah diverifikasi secara lokal, dengan tahap berikutnya berupa deployment, review materi, dan uji coba bersama sekolah.

Proposal sebaiknya melengkapi penjelasan ini dengan kebutuhan sekolah sasaran, hasil wawancara guru, rencana pilot, anggaran, dan indikator evaluasi. Angka efektivitas, mitra sekolah, serta kesesuaian kurikulum belum dibuktikan oleh repository.

## Status proyek

Fitur utama frontend dan backend telah diimplementasikan. Migrasi database lokal, pengujian domain/API/UI dan integrasi lokal, serta build produksi telah dijalankan. Sejumlah alur akun siswa/guru juga telah diperiksa melalui browser.

Inventaris Supabase remote, verifikasi secret server, dan tujuh migrasi database sudah selesai. Pemeriksaan browser lanjutan untuk pertanyaan guru, CSV dan catatan lintas perangkat telah lulus lokal; katalog dan pembatasan akses anonim telah diperiksa terhadap database remote melalui API aplikasi.

**Rilis produksi masih memerlukan** konfigurasi Auth/SMTP/domain dan hosting, deployment aplikasi HTTPS, serta verifikasi staging dan operasional. Penugasan kelas dan siswa individual telah tersedia serta diuji lokal. Lihat [status backend](backend/README.md) untuk batas verifikasi dan pekerjaan yang tersisa.

## Teknologi dan struktur

Stack aktual: **Next.js, React, TypeScript, CSS, dnd-kit, Lucide, Supabase Auth, PostgreSQL dan Storage**. Visualisasi memakai SVG/Canvas/CSS.

Arsitektur **modular monolith** memisahkan tanggung jawab fitur dalam satu deployment Next.js. Browser memanggil API; otorisasi dan nilai resmi dikelola backend. Perhitungan simulasi dipisahkan dari komponen visual.

```text
frontend/          Halaman, fitur UI, simulasi dan aset public/
backend/           Modul server, konfigurasi dan migrasi Supabase
shared/            Kontrak API dan engine eksperimen bersama
labora.md          PRD, design system dan acuan proposal
```

## Menjalankan aplikasi lokal

```sh
cd frontend
npm ci
npm run dev
```

Buka `http://localhost:3000`. Untuk mencoba tanpa backend, pilih demo siswa/guru pada `/login`; data latihan berada di browser tersebut. Tombol masuk aplikasi pada landing menuju `/dashboard`.

Untuk akun dan data kelas, ikuti [setup backend](backend/README.md). Konfigurasi berada di `frontend/.env.local`; jangan masukkan kredensial ke repository.

### Pemeriksaan pengembangan

Jalankan dari folder `frontend/`:

```sh
npm run check
npm test
npm run test:api
npm run test:ui
npm run build
```

Pengujian database dan browser akun memerlukan lingkungan Supabase lokal terpisah; petunjuknya tersedia di dokumentasi backend.

## Dokumentasi

- [labora.md](labora.md) — PRD, design system dan bahan proposal.
- [designSystem.md](designSystem.md) — panduan desain awal.
- [DESIGN.md](DESIGN.md) — dokumentasi desain implementasi.
- [ARCHITECTURE.md](ARCHITECTURE.md) — batas modul dan prinsip arsitektur.
- [backend/README.md](backend/README.md) — setup, data, keamanan dan status rilis.
- [backend/IMPLEMENTATION_PLAN.md](backend/IMPLEMENTATION_PLAN.md) — fase V1/V2, migrasi frontend dan release gates.

Foto preparat memiliki sumber dan lisensi masing-masing dalam modul mikroskop. Pertahankan atribusinya saat memakai aset untuk aplikasi atau bahan proposal.
