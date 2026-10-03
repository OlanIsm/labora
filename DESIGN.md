---
name: Labora
description: Eksperimen sains bebas untuk SMA/MA kelas X–XII, dengan alat bergambar, kontrol kontekstual dan tantangan opsional.
colors:
  ink: "#1f2430"
  muted: "#4c546a"
  line: "#dde5f0"
  bg: "#f8fbff"
  surface: "#fff"
  blue: "#5ec8ff"
  blue-light: "#eaf9ff"
  blue-ink: "#155c7b"
  pink: "#ff78b8"
  yellow: "#ffd84d"
  yellow-light: "#fff9db"
  green: "#7ed957"
  green-light: "#f1fceb"
  physics-ink: "#695000"
  biology-ink: "#365f27"
  control-border: "#76859a"
  error-ink: "#9a303b"
typography:
  display:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(3rem, 4.8vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(2rem, 3vw, 3rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(1.5rem, 2.3vw, 2rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  subtitle:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "Nunito Sans, sans-serif"
    fontWeight: 800
    lineHeight: 1.4
rounded:
  badge: "8px"
  field: "12px"
  navigation: "14px"
  button: "16px"
  panel: "20px"
  card: "24px"
  feature: "28px"
  hero: "32px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  grid: "20px"
  lg: "24px"
  xl: "32px"
  page: "40px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
    height: "48px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
    height: "48px"
  button-indicator:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
    height: "48px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    height: "48px"
  navigation-active:
    backgroundColor: "{colors.blue-light}"
    textColor: "{colors.blue-ink}"
    rounded: "{rounded.navigation}"
    padding: "12px 16px"
    height: "50px"
  subject-badge:
    rounded: "{rounded.badge}"
    padding: "5px 9px"
  experiment-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  inventory-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.navigation}"
    padding: "30px 8px 12px"
    height: "136px"
---

# Design System: Labora

## Meja bebas: penyederhanaan untuk pengguna pemula

Meja menjadi fokus, dengan satu tawaran alat saat kosong, bukan daftar langkah wajib. Rak awal berupa pilihan kecil bergambar; katalog lengkap tetap tersedia lewat pencarian dan disclosure. Diagram alat dipakai konsisten di rak dan meja agar bentuknya bisa dikenali sebelum membaca label. Siluet wadah, pipet, alat ukur dan mikroskop dibedakan; gambar ini skematis, bukan dimensi terkalibrasi. Mikroskop di meja dan bidang pandang sel merupakan dua tampilan berbeda.

Tindakan mengikuti benda dan isinya. Bahan tidak mempunyai tombol menyalakan alat; benda kosong tidak mempunyai tombol menuang. Kontrol fokus mikroskop tetap mudah ditemukan. Pengaturan lanjutan, grafik, pemisahan dan pengelolaan konfigurasi dibuka ketika diperlukan. Warna merek dan tipografi tetap dipertahankan; kesederhanaan tidak mengubah materi SMA/MA menjadi materi sekolah dasar.

## Overview

**Creative North Star: "Eksplorasi sains yang ramah"**

Labora mempertahankan identitas yang dipilih pengguna dalam [designSystem.md](designSystem.md): warna cerah, judul Fredoka, dan teks Nunito Sans. Antarmuka berbahasa Indonesia mengajak siswa SMA/MA kelas X–XII mencoba tindakan konkret, melihat perubahan, lalu memahami hasilnya. Bentuk membulat mengelompokkan tindakan, bukan mengubah laboratorium menjadi permainan anak kecil. Meja sandbox tidak mewajibkan langkah atau kuis; aktivitas terpandu lama tersedia sebagai Tantangan opsional.

Tema sengaja terang untuk ruang kelas dan penggunaan ponsel di siang hari. Teks gelap menjaga keterbacaan di atas warna merek yang terang. Implementasi tersusun di `frontend/app/styles.css`, `frontend/application/`, dan modul `frontend/features/`; komposisi khusus redesign tetap berada di `.impeccable/surface-redesign.md`. Visual eksperimen memakai CSS, SVG inline, dan ikon Lucide; logo serta mascot memakai aset yang disediakan pengguna.

**Key Characteristics:**
- Warna merek cerah dengan teks gelap yang terbaca.
- Judul ramah, instruksi langsung, dan tindakan berlabel.
- Eksperimen menjadi pusat perhatian; progres menjadi pendukung.
- Permukaan datar, ruang lega, dan alat dalam dialog pada ponsel.

## Colors

Palet langit biru, merah muda, kuning, dan hijau mempertahankan identitas Labora; warna subjek dipakai sesuai konteks, bukan sekaligus untuk menghias setiap elemen.

Frontmatter memuat nilai implementasi. Tonal ramp pada sidecar adalah skala OKLCH sintetis untuk pratinjau panel dokumentasi, bukan token tambahan yang sudah dipakai aplikasi.

### Primary
- **Biru langit (`blue`)**: tombol utama dan tanda merek.
- **Biru muda (`blue-light`)**: latar kimia, pratinjau indikator, dan navigasi aktif.
- **Biru tinta (`blue-ink`)**: tautan, label kimia, serta fokus keyboard.

### Secondary
- **Merah muda (`pink`)**: tombol indikator pada landing; cairan pH asam memakai override merah (`#ed6b77`), bukan merah muda.

### Tertiary
- **Kuning (`yellow`, `yellow-light`, `physics-ink`)**: identitas fisika; latar kuning muda juga membedakan petunjuk dan arahan guru.
- **Hijau (`green`, `green-light`, `biology-ink`)**: identitas biologi dan umpan balik berhasil. Bilah progres menggunakan hijau gelap, bukan teks putih di atas hijau cerah.

### Neutral
- **Tinta (`ink`)**: teks utama dan label di atas warna cerah.
- **Tinta sekunder (`muted`)**: uraian, metadata, dan navigasi tidak aktif.
- **Awan (`bg`) / putih (`surface`)**: latar aplikasi dan permukaan isi.
- **Garis (`line`)**: pemisah struktur; **batas kontrol (`control-border`)** membedakan input dan tombol sekunder dengan kontras sedikitnya 3:1 terhadap putih.
- **Tinta kesalahan (`error-ink`)**: teks kesalahan dengan latar merah sangat muda dan pesan bantuan.

**The Ink-on-Bright Rule.** Gunakan tinta gelap pada tombol biru dan merah muda yang terang; arahan teks putih pada tombol dalam panduan lama tidak dipakai karena kontrasnya tidak memadai.

## Typography

**Display Font:** Fredoka, sans-serif. **Body Font:** Nunito Sans, sans-serif.

Fredoka memberi karakter ramah pada judul tanpa mengganggu keterbacaan instruksi. Nunito Sans menangani paragraf, formulir, navigasi, pertanyaan, dan tombol. Font dimuat melalui Google Fonts; fallback implementasi adalah sans-serif.

### Hierarchy
- **Display**: headline landing menggunakan skala fluid pada frontmatter; menjadi 3rem pada lebar sampai 900px, lalu `clamp(2.75rem, 9vw, 3.75rem)` sampai 650px.
- **Headline**: judul halaman; halaman utama ponsel memakai 2rem.
- **Title / Subtitle**: judul bagian dan kelompok; instruksi eksperimen memakai 1.5rem, turun menjadi 1.375rem pada ponsel.
- **Body**: 16px dengan line-height 1.6; deskripsi halaman dibatasi sampai 68ch, salinan hero sampai 46ch.
- **Label**: kontrol penting memakai bobot 700 atau 800. Metadata umumnya 0.875rem atau 0.8125rem, bukan huruf kapital yang direnggangkan.

## Layout

### Lab interaction update

The current instruction and its direct-action button appear above the experiment bench. The full step list stays collapsed; tools remain secondary in a sidebar or native mobile dialog. Successful actions explain the observation and next step; incorrect actions keep corrective feedback visible until another interaction. Tool selection explains how to use the selected object.

Playful motion is brief and action-triggered: tool arrival/pour, settling beaker/endapan, microscope focus, ball landing, and water droplets. CSS transforms/opacity handle these sequences without an added animation dependency. Reduced motion disables them and hides transient tool effects, keeping the scientific state and text visible. No sound, confetti, or artificial delay is introduced.

Halaman publik memiliki wadah maksimum 1280px dengan padding samping 32px. Hero memasangkan teks dan percobaan indikator dalam dua kolom. Pilihan lab memakai tiga kolom yang setara karena ketiganya adalah tujuan navigasi sejajar, bukan kartu promosi tambahan.

Sidebar desktop mulai dalam bentuk ikon selebar 88px. Hover atau fokus keyboard membukanya dengan transisi 280ms; klik menu mempertahankannya terbuka melintasi pergantian halaman. Klik area utama menciutkannya kembali. Lebar terbuka 240px, atau 210px di bawah 1150px. Sidebar terbuka menimpa halaman pada lapisan lebih tinggi dengan bayangan; area utama tetap memakai margin 88px tanpa bergeser. Settings menyediakan pengaturan profil dan logout; kotak pesan motivasi di sidebar dihapus.

Logo navigasi dan favicon memakai aset `public/logo/logo.png`. Kartu kategori eksperimen bebas memakai mascot transparan: singa untuk Kimia, gajah untuk Fisika, dan kucing untuk Biologi. Label dan warna kategori tetap dipertahankan.

Pada lebar sampai 900px, sidebar diganti tab bawah berikon dan label. Siswa memiliki empat tujuan; guru memiliki lima karena Ruang guru tetap tersedia. Padding bawah isi memasukkan 108px dan safe area agar tab tidak menutupi isi. Pada lebar sampai 650px, hero, kartu lab, daftar eksperimen, detail, hasil, dan formulir guru berubah menjadi satu kolom; padding halaman aplikasi menjadi 16px di sisi.

Meja laboratorium dan instruksi berada dalam kolom utama, dengan inventori di kanan (280px, lalu 235px pada 1150px). Pada 900px inventori menjadi dialog modal berbentuk drawer bawah, maksimum 650px lebar dan 80dvh tinggi. Instruksi dan tombol tindakan muncul sebelum meja dan kontrol simulasi, baik dalam urutan baca maupun fokus keyboard. Siswa tidak wajib membuka inventori atau melakukan drag.

Pada lebar sampai 650px, visual meja setinggi 260px dan gelas beker berukuran 116 × 136px agar tindakan utama langkah muat pada viewport awal 390 × 844px.

Ritme ruang memakai langkah berulang 8, 12, 16, 20, 24, 32, 40, dan 64px; jarak mengikuti hubungan isi, bukan padding seragam di semua permukaan.

## Elevation & Depth

Kartu pilihan lab dan rekomendasi memakai warna subjek yang tegas: biru #5ec8ff, kuning #ffd84d, dan hijau #7ed957. Teks ditebalkan dengan tinta gelap sesuai subjek. Bayangan lembut `0 8px 20px` atau `0 10px 24px` memberi kedalaman. Rekomendasi mengikuti subjek eksperimennya. Drawer inventori memakai bayangan `0 -8px 32px #1f243030`.

Formulir dan Settings tetap tenang dengan garis tipis; warna kuat serta bayangan dipusatkan pada kartu lab dan rekomendasi.

## Shapes

Radius mengikuti fungsi: badge kecil, input ringkas, navigasi dan alat menengah, tombol membulat, lalu kartu dan panel yang lebih lapang. Nilai persis ada pada frontmatter. Drawer memiliki sudut atas membulat dan tepi bawah menyatu dengan layar. Lingkaran dipakai untuk bidang mikroskop dan benda sains, bukan untuk membuat semua kontrol menjadi pill.

## Components

### Buttons
- Tombol utama biru bertinta gelap, minimum 48px; versi kecil minimum 44px, versi besar minimum 56px. `height` pada frontmatter merangkum minimum tersebut, bukan tinggi tetap yang memotong label panjang.
- Tombol ghost putih dengan batas kontrol; hover memakai latar abu muda.
- Hover mengangkat tombol 1px, press mengecilkan ke 0.98; transisi 180ms. Fokus global memakai outline biru tinta 3px dengan offset 4px.
- Nama tindakan mengikuti langkah: Letakkan, Tuangkan, Tambahkan, Luncurkan, Lepaskan, atau Amati dengan. Tombol utama langkah langsung menjalankan tindakan untuk alat yang diperlukan.

### Inputs / Fields
- Label berada di atas input, select, dan textarea. Permukaan putih dengan batas yang lebih jelas daripada garis kartu, minimum 48px.
- Pencarian eksperimen memiliki label aksesibel, tombol hapus saat terisi, dan hasil kosong yang menawarkan penghapusan pencarian.
- Kesalahan formulir memakai teks gelap dan penjelasan, bukan warna saja. Kontrol range menampilkan nama besaran dan nilai; perbesaran mikroskop memakai tombol dengan `aria-pressed`.

### Navigation
- Header publik mengarah ke bagian Pilihan lab dan Cara belajar yang benar-benar tersedia, serta akses masuk/beranda. Tautan bagian disembunyikan pada ponsel kecil; akses akun tetap terlihat.
- Sidebar dan tab bawah memakai tujuan yang sama sesuai peran. Tujuan aktif diberi latar biru muda, tinta biru gelap, serta `aria-current="page"`.
- Detail, meja eksperimen, dan hasil tetap menandai Jelajahi lab sebagai tujuan aktif. Link lewati isi mengarah ke `#main`.

### Cards / Chips
- Pilihan lab adalah satu tautan utuh dengan nama subjek, pertanyaan nyata, dan jumlah eksperimen dari data.
- Kartu eksperimen putih bergaris menampilkan pratinjau simulasi yang diberi label, subjek, durasi, judul, uraian, dan tindakan. Padding isi 24px; hover mengangkat 3px dan menguatkan batas.
- Badge subjek berlabel dan berikon memakai pasangan latar/tinta subjek; bukan status dekoratif.
- State kosong memakai garis putus-putus, penjelasan, dan tindakan relevan bila tersedia.

### Inventory Dialog
- Desktop merender elemen `dialog` terbuka nonmodal di sebelah meja. Ponsel membukanya dengan `showModal()` melalui Pilih alat lain, dengan tombol tutup dan penutupan Escape bawaan browser.
- Memilih alat pada ponsel menutup dialog. Alat terpilih memakai `aria-pressed`; alat langkah saat ini memiliki label Pakai sekarang dan batas lebih kuat.
- Drag pointer menjadi alternatif di layar besar. Tombol tindakan langsung adalah jalur yang tidak memerlukan drag; bukan klaim dukungan keyboard drag-and-drop.
- Reset memakai konfirmasi native browser bila sudah ada langkah yang dikerjakan, bukan modal kustom tambahan.

### Experiment / Indicator
- Landing memiliki percobaan indikator interaktif: Tambahkan indikator mengubah cairan menjadi merah dan mengganti pengamatan menjadi kondisi asam sekitar pH 3; Ulangi percobaan mengembalikan keadaan awal. Pengamatan diumumkan melalui `aria-live`.
- Meja menampilkan objek, hasil terlabel, dan perubahan sesuai state eksperimen. Kuis menyajikan opsi jawaban berupa tombol; feedback memakai `role="status"`. Daftar semua langkah memakai `details` native.
- Motion menjelaskan perubahan cairan (500ms), fokus/perbesaran sel (300ms), arus listrik, dan ayunan aktif. `prefers-reduced-motion` menghentikan animasi, transisi, dan smooth scrolling.
- Penyimpanan hasil menampilkan Menyimpan hasil..., menonaktifkan tombol selama proses, dan memberikan pesan coba lagi saat gagal. Loading, hasil kosong, tugas kosong, dan kegagalan sinkronisasi memiliki tampilan yang terpisah.

## Do's and Don'ts

### Do:
- **Do** pertahankan Fredoka, Nunito Sans, dan palet merek yang dipilih pengguna.
- **Do** gunakan tinta gelap pada warna cerah dan label teks untuk hasil serta status.
- **Do** sediakan tindakan berlabel yang dapat dijalankan tanpa drag.
- **Do** pertahankan tab ponsel berlabel, safe area, dan fokus keyboard yang terlihat.
- **Do** gunakan ilustrasi sains berbasis kode dan motion hanya untuk perubahan yang bermakna.

### Don't:
- **Don't** mewariskan teks putih pada tombol merek cerah dari panduan lama.
- **Don't** menambahkan tujuan navigasi, kemampuan simulasi, atau klaim hasil yang tidak tersedia.
- **Don't** mengganti tema terang dengan default gelap tanpa konteks penggunaan baru.
- **Don't** membuat bayangan, gradien, atau dekorasi menjadi pusat perhatian di setiap kartu.
- **Don't** menyebut pratinjau statis sebagai percobaan interaktif penuh.
