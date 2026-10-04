# MANUAL BOOK LABORA

## Panduan penggunaan laboratorium sains virtual

**Belajar sains dengan mencoba.**

| Informasi           | Keterangan                                           |
| ------------------- | ---------------------------------------------------- |
| Nama aplikasi       | Labora                                               |
| Jenis aplikasi      | Laboratorium sains virtual berbasis web              |
| Bidang pembelajaran | Kimia, Fisika, dan Biologi                           |
| Pembaca             | Siswa, guru, pengelola sekolah, dan pengembang       |
| Alamat aplikasi     | [labora-mu.vercel.app](https://labora-mu.vercel.app) |
| Edisi dokumen       | 1.0                                                  |
| Tanggal penyusunan  | 4 Oktober 2026                                       |
| Acuan implementasi  | Repository Labora sampai commit `45f0c4f`            |

Dokumen ini menjelaskan fitur yang tersedia dalam implementasi proyek, cara menjalankannya, dan batas penggunaannya. Tampilan atau ketersediaan fitur pada deployment mengikuti versi aplikasi dan konfigurasi server yang dipasang. Pengujian lokal tidak berarti seluruh konfigurasi produksi telah diverifikasi.

---

## Daftar isi

1. [Pendahuluan](#1-pendahuluan)
2. [Persiapan penggunaan](#2-persiapan-penggunaan)
3. [Panduan mulai cepat](#3-panduan-mulai-cepat)
4. [Akun dan autentikasi](#4-akun-dan-autentikasi)
5. [Mengenal antarmuka](#5-mengenal-antarmuka)
6. [Beranda](#6-beranda)
7. [Eksperimen bebas Kimia](#7-eksperimen-bebas-kimia)
8. [Simulasi Fisika](#8-simulasi-fisika)
9. [Laboratorium Biologi](#9-laboratorium-biologi)
10. [Tantangan terpandu](#10-tantangan-terpandu)
11. [Hasil dan progres belajar](#11-hasil-dan-progres-belajar)
12. [Panduan siswa mengerjakan tugas](#12-panduan-siswa-mengerjakan-tugas)
13. [Panduan guru dan pengelolaan kelas](#13-panduan-guru-dan-pengelolaan-kelas)
14. [Settings, bantuan, dan notifikasi](#14-settings-bantuan-dan-notifikasi)
15. [Penyimpanan dan sinkronisasi](#15-penyimpanan-dan-sinkronisasi)
16. [Pemecahan masalah](#16-pemecahan-masalah)
17. [Panduan instalasi untuk pengembang](#17-panduan-instalasi-untuk-pengembang)
18. [Deployment dan pengelolaan layanan](#18-deployment-dan-pengelolaan-layanan)
19. [Skenario demonstrasi dan pemeriksaan](#19-skenario-demonstrasi-dan-pemeriksaan)
20. [Lampiran](#20-lampiran)

---

## 1. Pendahuluan

### 1.1 Tentang Labora

Labora merupakan aplikasi laboratorium sains virtual yang dapat digunakan melalui browser. Pengguna mencoba alat, mengubah variabel, melihat perubahan pada simulasi, dan menghubungkan pengamatan dengan konsep ilmiah.

Aplikasi menyediakan ruang eksplorasi Kimia, Fisika, dan Biologi. Selain eksperimen bebas, Labora memiliki tantangan dengan langkah terpandu, pertanyaan pemahaman, hasil pengerjaan, dan fasilitas tugas untuk guru.

### 1.2 Tujuan penggunaan

Labora membantu pengguna untuk:

- Mengenali alat dan bahan laboratorium melalui tampilan virtual.
- Mencoba hubungan antara tindakan, variabel, dan hasil pengamatan.
- Mengulang percobaan untuk membandingkan hasil.
- Berlatih mengikuti prosedur dan menjawab pertanyaan sains.
- Mencatat hipotesis, pengamatan, dan kesimpulan.
- Mengelola tugas eksperimen dan meninjau hasil siswa.

Fokus pengguna awal proyek adalah siswa SMA/MA kelas X–XII dan guru sains. Pemilihan kegiatan tetap perlu disesuaikan dengan tujuan pembelajaran serta kesiapan siswa.

### 1.3 Batas model simulasi

Simulasi memakai model dan materi yang telah disiapkan dalam aplikasi. Alat virtual tidak mewakili seluruh kondisi, ketidakpastian pengukuran, atau prosedur laboratorium fisik. Labora dapat mendampingi penjelasan dan persiapan praktikum; penggunaan alat nyata tetap mengikuti arahan guru serta prosedur laboratorium sekolah.

Perbesaran preparat Biologi merupakan pengolahan tampilan foto dalam simulasi. Memperbesar tampilan tidak menciptakan detail optik baru yang tidak terdapat dalam foto sumber. Identifikasi sel darah berfokus pada bentuk dan jenis sel, bukan pemeriksaan golongan darah ABO.

### 1.4 Dua jenis kegiatan

| Jenis kegiatan     | Cara belajar                                                                         | Hasil yang tersedia                                                          |
| ------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Eksperimen bebas   | Memilih alat atau simulasi, mengubah variabel, dan mengeksplorasi tanpa urutan wajib | Pengamatan, konfigurasi simulasi, serta catatan pada ruang yang mendukungnya |
| Tantangan terpandu | Mengikuti langkah, memakai alat yang sesuai, dan menjawab pertanyaan                 | Penyelesaian langkah, penilaian, penjelasan, dan progres                     |

Mencoba eksperimen bebas tidak otomatis menyelesaikan tantangan atau menghasilkan nilai tugas. Untuk memperoleh hasil tantangan, selesaikan alur terpandu dan kirim hasilnya.

## 2. Persiapan penggunaan

### 2.1 Perangkat dan browser

Labora digunakan melalui komputer, laptop, tablet, atau ponsel dengan browser yang mendukung JavaScript, SVG, Canvas, dan penyimpanan browser. Tidak diperlukan instalasi aplikasi desktop untuk pengguna biasa.

Gunakan browser yang telah diperbarui. Proyek memiliki pengujian otomatis berbasis Chromium, tetapi hal itu tidak menjamin seluruh versi browser dan kombinasi perangkat memiliki perilaku yang identik.

Komputer atau laptop memudahkan pengaturan alat dan pengamatan diagram. Pada ponsel, beberapa panel alat ditampilkan sebagai panel yang dapat dibuka dan ditutup.

### 2.2 Koneksi internet

Internet diperlukan untuk membuka aplikasi yang dihosting, membuat akun, mengonfirmasi email, memulihkan kata sandi, menyinkronkan progres, dan menggunakan fitur kelas.

Mode demo menyimpan data di browser, tetapi aplikasi bukan paket offline yang dijamin dapat dibuka tanpa jaringan. Sebagian pemeriksaan jawaban latihan juga dapat memanggil layanan aplikasi.

### 2.3 Pilihan akses

| Akses       | Kegunaan                                                    | Penyimpanan dan batas                                              |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Tamu        | Melihat beranda dan mencoba halaman eksplorasi yang terbuka | Halaman tertentu meminta login atau profil demo                    |
| Demo siswa  | Mencoba tantangan dan pengalaman siswa tanpa pendaftaran    | Data lokal di browser tersebut; bukan nilai resmi akun sekolah     |
| Demo guru   | Mencoba pembuatan tugas dan laporan dalam demonstrasi       | Data lokal; tidak membagikan tugas ke akun siswa di perangkat lain |
| Akun online | Menyimpan progres akun dan mengikuti kegiatan sekolah       | Memerlukan konfigurasi backend, autentikasi, dan jaringan          |

Jangan mengandalkan data demo untuk berpindah perangkat. Penggunaan browser privat, penghapusan data situs, atau pembatasan storage dapat membuat data lokal tidak bertahan.

## 3. Panduan mulai cepat

### 3.1 Mencoba sebagai siswa

1. Buka alamat aplikasi.
2. Pilih **Masuk** untuk membuka halaman login.
3. Tekan **Coba sebagai siswa**.
4. Setelah Beranda terbuka, pilih **Tantangan**.
5. Buka kartu **Identifikasi Asam dan Basa**.
6. Baca tujuan, teori, alat, dan bahan.
7. Tekan **Masuk dan coba**.
8. Ikuti langkah menaruh gelas, menuang larutan, dan menambahkan indikator.
9. Jawab pertanyaan berdasarkan pengamatan.
10. Tekan **Lihat hasil eksperimen** untuk melihat hasil.

### 3.2 Mencoba eksperimen bebas

1. Buka Beranda atau menu **Eksperimen**.
2. Pilih Kimia, Fisika, atau Biologi.
3. Buka ruang atau simulasi yang tersedia.
4. Gunakan petunjuk di halaman untuk memilih alat atau mengubah variabel.
5. Amati perubahan dan ulangi dengan satu variabel berbeda.

### 3.3 Mencoba sebagai guru

1. Buka halaman login.
2. Tekan **Coba sebagai guru**.
3. Buka **Ruang guru**.
4. Buat tugas dari eksperimen yang tersedia.
5. Isi judul, kelas atau kelompok, arahan, serta panduan tahap.
6. Simpan tugas dan buka laporan yang dihasilkan.

Alur ini menunjukkan antarmuka guru dalam mode lokal. Untuk pembagian tugas antarakun, gunakan akun online dan kelas yang benar-benar terdaftar.

## 4. Akun dan autentikasi

### 4.1 Pendaftaran akun online

1. Dari halaman login, buka tautan pendaftaran.
2. Isi **Nama**, **Email**, dan **Kata sandi**.
3. Gunakan email yang dapat diakses. Formulir akun online meminta kata sandi minimal delapan karakter; konfigurasi layanan Auth dapat menerapkan syarat tambahan.
4. Kirim formulir pendaftaran.
5. Apabila konfirmasi email diperlukan, buka email yang dikirim layanan autentikasi.
6. Klik tautan konfirmasi, misalnya **Confirm my email**.
7. Setelah proses konfirmasi selesai, ikuti halaman yang ditampilkan untuk masuk atau membuka aplikasi.

Pemilihan peran siswa atau guru pada profil lokal tidak memberikan hak guru pada akun online. Pada akun online, peran mengikuti keanggotaan sekolah yang ditetapkan backend.

### 4.2 Login

1. Buka **Masuk**.
2. Masukkan email dan kata sandi akun.
3. Kirim formulir dan tunggu autentikasi selesai.
4. Jika berhasil, aplikasi membuka pengalaman akun.

Jika login ditolak, periksa penulisan email, kata sandi, dan konfirmasi email. Jangan mengirim percobaan login berulang tanpa jeda ketika aplikasi menampilkan pembatasan permintaan.

### 4.3 Konfirmasi email

Konfirmasi membuktikan bahwa pengguna memiliki akses ke alamat email pendaftaran. Membuka halaman aplikasi saja tidak menggantikan proses tersebut.

Jika tautan konfirmasi membawa pengguna ke `localhost`, konfigurasi alamat aplikasi atau redirect Auth perlu diperiksa oleh pengelola. Pengguna produksi seharusnya dikembalikan ke domain produksi. Panduan teknis tersedia pada Bab 18.

### 4.4 Lupa kata sandi

1. Buka halaman login.
2. Klik **Lupa password** di samping tautan pendaftaran.
3. Isi alamat email akun.
4. Tekan tombol pengiriman tautan pemulihan.
5. Buka email pemulihan dan klik tautannya.
6. Setelah sesi pemulihan terverifikasi, buka **Settings** dan bagian **Kata sandi** sesuai arahan aplikasi.
7. Masukkan kata sandi baru dan simpan.

Gunakan tautan yang masih berlaku. Jika pemulihan gagal, ulangi permintaan melalui halaman pemulihan dan periksa pesan yang ditampilkan.

### 4.5 Logout

Gunakan pilihan keluar pada menu akun atau **Settings** setelah memakai perangkat bersama. Menutup tab tidak selalu berarti sesi akun sudah diakhiri. Logout juga bukan perintah untuk menghapus seluruh data demo yang tersimpan di browser.

## 5. Mengenal antarmuka

### 5.1 Menu utama

| Menu       | Fungsi                                                                            |
| ---------- | --------------------------------------------------------------------------------- |
| Beranda    | Rekomendasi atau kelanjutan eksperimen, ringkasan progres, pilihan lab, dan tugas |
| Eksperimen | Pintu masuk eksplorasi Kimia, Fisika, dan Biologi                                 |
| Tantangan  | Daftar kegiatan terpandu dengan langkah dan pertanyaan                            |
| Tugas      | Tugas yang tersedia bagi pengguna sesuai aksesnya                                 |
| Progres    | Riwayat hasil, penyelesaian eksperimen, dan ringkasan nilai                       |
| Ruang guru | Pengelolaan tugas dan laporan; muncul untuk pengguna dengan peran guru            |
| Settings   | Profil, akun, kata sandi, serta sekolah dan kelas pada akun online                |

### 5.2 Navigasi desktop dan mobile

Pada desktop, menu berada di sidebar. Sidebar dapat dibuka lebih lebar untuk menampilkan label. Saat tampilan ringkas hanya menunjukkan ikon, arahkan penunjuk atau buka sidebar melalui kontrol yang tersedia.

Pada layar kecil, navigasi utama berada di bagian bawah. Jika sebagian menu berada di luar bagian yang terlihat, gunakan navigasi yang tersedia atau menu akun untuk menuju halaman terkait.

### 5.3 Kontrol umum

- **Tombol utama:** menjalankan tindakan penting, misalnya mulai, menaruh alat, atau menyimpan tugas.
- **Tautan kembali:** menuju halaman yang ditentukan aplikasi. Detail yang dibuka dari Tantangan memiliki tautan **Kembali ke tantangan**.
- **Tombol nonaktif:** tindakan belum siap, sedang diproses, atau membutuhkan langkah sebelumnya.
- **Pesan status:** menjelaskan hasil tindakan atau kondisi sinkronisasi.
- **Pesan kesalahan:** menunjukkan tindakan belum berhasil atau belum diterima.

Saat drag-and-drop sulit digunakan, pakai tombol tindakan berlabel yang tersedia. Tombol tersebut menjalankan tindakan eksperimen melalui alur yang sama.

## 6. Beranda

### 6.1 Sapaan dan banner eksperimen

Beranda menampilkan sapaan pengguna dan satu eksperimen yang direkomendasikan. Jika ditemukan sesi yang belum selesai, tombol dapat berubah menjadi **Lanjutkan eksperimen**. Jika tidak, pengguna dapat membuka eksperimen yang direkomendasikan melalui **Coba eksperimen ini**.

Pratinjau pada banner menggambarkan kegiatan atau hasil contoh. Pratinjau tersebut bukan bukti bahwa pengguna telah mengerjakan eksperimen.

### 6.2 Ringkasan progres

Pill progres menampilkan jumlah eksperimen selesai dari sembilan tantangan, bar progres, dan tautan **Lihat progres**. Nilainya mengikuti hasil yang tersedia pada mode pengguna.

### 6.3 Jelajahi lab

Tiga kartu lab memakai warna dan maskot berbeda:

| Lab     | Warna utama | Maskot |
| ------- | ----------- | ------ |
| Kimia   | Biru        | Singa  |
| Fisika  | Kuning      | Gajah  |
| Biologi | Hijau       | Kucing |

Klik kartu untuk membuka pilihan atau ruang pembelajaran yang sesuai. Beranda juga menampilkan tugas dan hasil terbaru ketika data tersebut tersedia.

## 7. Eksperimen bebas Kimia

### 7.1 Membuka lab

1. Pilih **Eksperimen** atau kartu Kimia.
2. Buka ruang Kimia yang tersedia.
3. Baca panduan awal atau gunakan bantuan pada halaman.
4. Kenali meja, rak alat dan bahan, panel pengaturan, serta pengamatan.

Eksperimen bebas memberi pengguna kendali atas susunan alat dan tindakan. Tidak ada kewajiban menyelesaikan urutan kuis seperti pada Tantangan.

### 7.2 Menaruh dan memilih alat

1. Pilih alat atau bahan dari rak.
2. Gunakan tombol pengambilan/penempatan yang tersedia, atau seret ke meja.
3. Pilih objek di meja untuk membuka kontrolnya.
4. Baca nama alat, fungsi, kondisi, dan tindakan yang ditawarkan.

Penempatan alat dapat dipengaruhi ukuran meja dan ruang yang tersedia. Jika penempatan ditolak, baca umpan balik, geser objek lain, atau pilih lokasi berbeda.

### 7.3 Menuang dan melakukan tindakan

1. Pilih wadah atau bahan sumber.
2. Tentukan wadah tujuan melalui kontrol yang ditampilkan, atau lakukan drag-and-drop pada tindakan yang mendukungnya.
3. Atur jumlah atau parameter jika tersedia.
4. Jalankan tindakan dan amati perubahan warna, volume, endapan, suhu, atau pembacaan alat yang relevan.

Tindakan yang tersedia mengikuti alat dan kondisi percobaan. Tidak semua kombinasi bahan menghasilkan reaksi yang dimodelkan aplikasi.

### 7.4 Contoh kegiatan: membandingkan larutan

1. Siapkan wadah dan larutan yang tersedia.
2. Catat kondisi awal.
3. Gunakan indikator atau alat pengukuran yang mendukung kegiatan tersebut.
4. Amati pembacaan atau perubahan warna.
5. Ulangi dengan larutan atau perlakuan berbeda.
6. Bandingkan hasil berdasarkan model yang dijelaskan dalam bantuan.

Contoh ini merupakan pola eksplorasi. Nama dan pilihan bahan mengikuti katalog pada halaman; jangan menganggap semua bahan memiliki sifat yang sama dengan larutan contoh pada Tantangan Asam dan Basa.

### 7.5 Kontrol meja

| Kontrol                     | Kegunaan                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| Batalkan tindakan / Undo    | Kembali ke perubahan sebelumnya yang tercatat                     |
| Ulangi tindakan / Redo      | Mengulangi perubahan yang dibatalkan jika riwayat mendukungnya    |
| Jeda / Jalankan simulasi    | Mengatur apakah waktu simulasi berjalan                           |
| Kecepatan simulasi          | Mengubah laju waktu pada simulasi yang mendukungnya               |
| Reset simulasi / Reset meja | Mengembalikan percobaan sesuai perilaku reset pada ruang tersebut |
| Simpan                      | Menyimpan konfigurasi sesuai mode akun atau browser               |
| Muat                        | Membuka konfigurasi yang telah disimpan                           |
| Gambar SVG                  | Mengunduh representasi meja dalam format SVG                      |
| Bantuan & teori             | Membaca petunjuk dan batas model                                  |

Sebagian kontrol berada di **Pilihan meja**. Simpan konfigurasi yang diperlukan sebelum melakukan reset.

### 7.6 Buku Catatan Lab

Pada ruang yang menyediakan buku catatan:

1. Buka **Buku Catatan Lab**.
2. Isi **Hipotesis**: perkiraan sebelum percobaan.
3. Isi **Pengamatan**: perubahan yang benar-benar terlihat atau terbaca.
4. Isi **Kesimpulan**: hubungan antara hasil dan hipotesis.
5. Simpan catatan melalui tombol yang tersedia.
6. Gunakan ekspor teks untuk membawa catatan ke laporan pembelajaran.

Catatan akun menggunakan layanan catatan milik pengguna. Catatan demo mengikuti penyimpanan lokal. Ekspor teks catatan berbeda dari ekspor gambar meja dan ekspor CSV laporan guru.

## 8. Simulasi Fisika

### 8.1 Daftar simulasi

| Simulasi                 | Fokus pembelajaran                                                      |
| ------------------------ | ----------------------------------------------------------------------- |
| Meriam & Target          | Gerak parabola, variabel peluncuran, hambatan udara, dan pilihan planet |
| Roller Coaster Maker     | Bentuk lintasan dan perubahan energi pada gerak kereta                  |
| Lab Kapal Selam          | Gaya apung, kondisi ballast, dan tekanan hidrostatik                    |
| Sandbox Laser & Lensa    | Pemantulan, pembiasan, dan pembentukan bayangan                         |
| Rangkaian Seri & Paralel | Susunan komponen, sambungan kabel, arus, dan terang lampu               |

Buka menu Fisika dan pilih **Buka simulasi** pada kartu kegiatan. Lima simulasi ini berbeda dari tiga tantangan terpandu Fisika.

### 8.2 Meriam & Target

1. Atur sudut tembak dan kecepatan awal.
2. Periksa pilihan lingkungan serta parameter lain pada panel.
3. Jalankan peluncuran.
4. Amati lintasan dan hasil pengukuran.
5. Ubah satu variabel, lalu ulangi.

Contoh pertanyaan: bagaimana jangkauan berubah ketika sudut diubah sementara kecepatan awal dipertahankan? Jika hambatan udara atau gravitasi berbeda, bandingkan dengan kondisi sebelumnya, bukan hanya dengan rumus ideal.

### 8.3 Roller Coaster Maker

1. Susun atau gambar lintasan melalui kontrol yang tersedia.
2. Jalankan kereta pada lintasan.
3. Amati gerak serta indikator energi.
4. Ubah tinggi atau bentuk lintasan dan bandingkan perilakunya.

Gunakan petunjuk halaman apabila lintasan belum dapat dijalankan. Bentuk lintasan menentukan kondisi gerak yang dapat dihasilkan model.

### 8.4 Lab Kapal Selam

1. Atur air dalam tangki dibandingkan udara.
2. Atur gaya dorong atau target kedalaman jika tersedia.
3. Jalankan atau amati simulasi.
4. Bandingkan keadaan mengapung, turun, dan mencapai kedalaman tertentu.
5. Catat perubahan tekanan atau pembacaan yang ditampilkan.

### 8.5 Sandbox Laser & Lensa

1. Pilih perangkat optik yang tersedia.
2. Susun sumber cahaya, lensa, cermin, atau objek sesuai kontrol halaman.
3. Atur posisi dan parameter optik.
4. Amati jalur sinar dan pembentukan bayangan.
5. Ubah satu pengaturan untuk membandingkan hasil.

### 8.6 Rangkaian Seri & Paralel

1. Letakkan komponen dari panel.
2. Sambungkan kabel melalui titik koneksi yang disediakan.
3. Pastikan susunan rangkaian sesuai tujuan kegiatan.
4. Amati pembacaan listrik dan keadaan lampu.
5. Bandingkan susunan seri dengan paralel.

Rangkaian bebas ini memiliki antarmuka tersendiri. Ikuti petunjuknya; cara menyambungkan kabel dapat berbeda dari langkah **Rangkaian Hukum Ohm** pada Tantangan.

## 9. Laboratorium Biologi

### 9.1 Pengamatan mikroskop

Laboratorium Biologi menyediakan pengamatan preparat melalui mikroskop virtual. Pilih preparat, ubah objektif, atur fokus dan pencahayaan, lalu amati struktur yang dijelaskan pada halaman.

### 9.2 Preparat yang tersedia

| Preparat   | Fokus pengamatan                                         |
| ---------- | -------------------------------------------------------- |
| Darah      | Perbandingan bentuk sel pada sampel darah                |
| Bawang     | Dinding dan susunan sel tumbuhan                         |
| Pipi       | Sel epitel hewan dan perbedaannya dari sel tumbuhan      |
| Elodea     | Sel tumbuhan dan kloroplas                               |
| Stomata    | Celah stomata dan sel penjaga                            |
| Paramecium | Organisme bersel satu dan struktur yang tampak pada foto |
| Ragi       | Bentuk sel jamur dan pertunasan pada sampel              |

### 9.3 Langkah penggunaan

1. Buka lab Biologi.
2. Pilih preparat yang ingin diamati.
3. Mulai dari objektif rendah agar konteks bidang pandang mudah dikenali.
4. Atur fokus hingga struktur dapat diamati.
5. Sesuaikan pencahayaan.
6. Pilih objektif lain dan perhatikan perubahan bidang pandang.
7. Baca penjelasan dan pertanyaan pengamatan.
8. Catat perbedaan antara dua preparat jika diperlukan.

### 9.4 Perbesaran

Okuler simulasi adalah 10×. Pilihan objektif menghasilkan perbesaran total berikut:

| Objektif | Perbesaran total |
| -------- | ---------------- |
| 4×       | 40×              |
| 10×      | 100×             |
| 40×      | 400×             |
| 100×     | 1.000×           |

Perbesaran total dihitung dari okuler dikalikan objektif. Ini adalah nilai perbesaran simulasi; detail foto tetap dibatasi sumber gambar.

### 9.5 Atribusi foto

Foto preparat memiliki penulis, sumber, dan lisensi yang ditampilkan pada modul pengamatan. Pertahankan atribusi apabila foto dipakai kembali dalam bahan presentasi atau laporan yang dibagikan. Rincian aset tersedia dalam `frontend/features/laboratory/subjects/biology/microscope.ts`.

## 10. Tantangan terpandu

### 10.1 Membuka tantangan

1. Pilih menu **Tantangan**.
2. Lihat kategori, durasi, judul, dan pratinjau kartu.
3. Pilih kegiatan.
4. Baca tujuan, teori, alat, bahan, dan pratinjau langkah.
5. Tekan **Masuk dan coba** atau **Mulai tugas** jika dibuka melalui penugasan.

Tautan **Kembali ke tantangan** pada detail mengembalikan pengguna ke daftar ketika kartu dibuka dari Tantangan. Penanda asal tersimpan dalam URL sehingga tujuan kembali tetap tersedia setelah refresh.

### 10.2 Katalog kegiatan

Durasi merupakan estimasi yang ditampilkan aplikasi, bukan batas waktu pengerjaan.

| Kategori | Tantangan                       | Estimasi |
| -------- | ------------------------------- | -------- |
| Kimia    | Identifikasi Asam dan Basa      | 12 menit |
| Kimia    | Reaksi Pembentukan Endapan      | 10 menit |
| Kimia    | Pengenceran dan Konsentrasi     | 10 menit |
| Fisika   | Rangkaian Hukum Ohm             | 15 menit |
| Fisika   | Gerak Parabola                  | 12 menit |
| Fisika   | Bandul Sederhana                | 10 menit |
| Biologi  | Pengamatan Sel dengan Mikroskop | 14 menit |
| Biologi  | Transpirasi Tumbuhan            | 11 menit |
| Biologi  | Identifikasi Sel Darah          | 9 menit  |

### 10.3 Bagian ruang eksperimen

| Bagian                     | Fungsi                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| Tentang eksperimen         | Kembali ke penjelasan kegiatan                                     |
| Judul                      | Menunjukkan kegiatan yang sedang dijalankan                        |
| Ulangi                     | Memulai kembali sesi setelah konfirmasi apabila sudah ada progres  |
| Langkah dan persen progres | Menunjukkan posisi pengguna dalam prosedur                         |
| Instruksi                  | Menjelaskan tindakan yang dibutuhkan                               |
| Butuh petunjuk?            | Membuka bantuan untuk langkah saat ini                             |
| Tombol tindakan            | Alternatif drag-and-drop untuk tindakan yang diminta               |
| Pesan status               | Memberi umpan balik tentang tindakan dan pengamatan                |
| Meja eksperimen            | Area visual serta target penempatan alat                           |
| Alat & bahan               | Inventaris; label **Pakai sekarang** menandai item yang dibutuhkan |
| Semua langkah eksperimen   | Membuka daftar urutan dan status langkah                           |

Pada mobile, pilih **Pilih alat lain** untuk membuka inventaris, lalu tutup panel saat kembali ke meja.

### 10.4 Drag-and-drop dan tombol tindakan

1. Baca instruksi sebelum menyeret alat.
2. Pilih item berlabel **Pakai sekarang**.
3. Seret ke meja untuk penempatan.
4. Untuk penuangan atau penambahan bahan Kimia, seret ke area gelas yang menjadi tujuan tindakan.
5. Lepaskan pada target dan baca umpan balik.

Jika target sulit dijangkau, gunakan tombol seperti **Letakkan gelas beker**, **Tuangkan larutan a**, atau **Tambahkan indikator ph**. Memilih alat saja belum selalu menjalankan tindakan.

Untuk akun online, penempatan ditampilkan langsung oleh engine frontend sebelum respons penyimpanan selesai. Aksi berikutnya menunggu pengakuan server agar urutan sesi konsisten. Jika jaringan gagal, tampilan kembali ke state yang terkonfirmasi dan pengguna dapat mengirim ulang tindakan. Jawaban dan nilai tetap diperiksa server.

### 10.5 Contoh: Identifikasi Asam dan Basa

1. Buka detail kegiatan dan mulai eksperimen.
2. Letakkan gelas beker di meja.
3. Tuangkan Larutan A.
4. Tambahkan indikator pH.
5. Amati warna dan informasi pH pada contoh larutan.
6. Jawab pertanyaan pemahaman berdasarkan pengamatan dan teori.
7. Baca umpan balik jawaban.
8. Tekan **Lihat hasil eksperimen**.

Warna merah dan pH sekitar 3 pada contoh ini menunjukkan kondisi larutan asam. Hasil tersebut berlaku untuk larutan yang dimodelkan dalam kegiatan tersebut.

### 10.6 Contoh: Pengamatan Sel dengan Mikroskop

1. Letakkan kaca objek di baki preparat.
2. Tambahkan sampel tumbuhan sesuai instruksi.
3. Tambahkan air untuk preparat basah.
4. Letakkan mikroskop di samping kaca objek.
5. Masukkan preparat dan jalankan tindakan pengamatan/fokus yang diminta.
6. Gunakan kontrol perbesaran untuk mengamati struktur.
7. Jawab pertanyaan dan buka hasil.

Kegiatan terpandu ini menggunakan urutan prosedur. Halamannya berbeda dari ruang pengamatan tujuh foto preparat pada eksperimen bebas.

### 10.7 Contoh: Rangkaian Hukum Ohm

1. Ikuti penempatan komponen sesuai instruksi kegiatan.
2. Sambungkan atau aktifkan rangkaian pada langkah yang diminta.
3. Amati keadaan lampu dan pembacaan arus.
4. Ubah tegangan atau hambatan menggunakan kontrol yang tersedia.
5. Bandingkan arus pada pengaturan berbeda.
6. Jawab pertanyaan dan selesaikan kegiatan.

Gunakan hubungan `I = V / R` untuk memahami model rangkaian. Satuan yang relevan adalah ampere untuk arus, volt untuk tegangan, dan ohm untuk hambatan.

## 11. Hasil dan progres belajar

### 11.1 Membuka hasil

Selesaikan langkah dan pertanyaan, lalu tekan **Lihat hasil eksperimen**. Pada akun online, tunggu hasil berhasil disimpan. Jika penyimpanan gagal, gunakan pesan yang ditampilkan untuk mencoba lagi; jangan menganggap hasil telah tersimpan hanya karena meja menunjukkan langkah selesai.

### 11.2 Membaca halaman hasil

Halaman hasil dapat menampilkan:

- Judul kegiatan dan nilai pemahaman.
- Jumlah langkah selesai.
- Ketepatan langkah dan persentase jawaban benar.
- Konsep dan teori yang dipelajari.
- Penjelasan pertanyaan serta jawaban yang dinilai.
- Pilihan mencoba kegiatan lain atau mengulang eksperimen.

### 11.3 Dasar penilaian

Penilaian menggabungkan ketepatan eksperimen dan kuis:

```text
Nilai akhir = pembulatan((40% × akurasi eksperimen) + (60% × akurasi kuis))
```

Contoh ilustratif: jika akurasi eksperimen 100% dan kuis 80%, nilai akhir adalah 88%. Angka ini adalah contoh perhitungan, bukan data siswa tertentu.

Pada akun online, nilai resmi dihitung backend. Tampilan atau data lokal yang dimodifikasi tidak menjadi dasar nilai resmi.

### 11.4 Halaman Progres

1. Buka **Progres** atau **Lihat progres**.
2. Lihat jumlah eksperimen selesai, rata-rata nilai, dan jumlah kategori yang dicoba.
3. Buka riwayat untuk membaca hasil sebuah pengerjaan.
4. Gunakan **Muat riwayat berikutnya** jika tersedia.

Jumlah eksperimen selesai mengacu pada kegiatan berbeda yang telah diselesaikan; beberapa pengerjaan kegiatan yang sama tidak berarti pengguna menyelesaikan jenis eksperimen baru.

### 11.5 Mengulang kegiatan

Pengguna dapat mengulang eksperimen untuk berlatih. Pada akun online, hasil pengerjaan yang telah disubmit dipertahankan sebagai riwayat attempt. Laporan tugas menggunakan hasil terbaik dari pengerjaan selesai yang masuk dalam laporan; pengulangan tetap mengikuti ketentuan akses dan batas tugas yang diterapkan server.

## 12. Panduan siswa mengerjakan tugas

### 12.1 Bergabung dengan kelas

1. Login menggunakan akun online.
2. Minta kode undangan kepada guru.
3. Buka **Settings** → **Sekolah & kelas**.
4. Isi **Kode undangan**.
5. Tekan **Gabung kelas**.
6. Periksa pesan keberhasilan dan keanggotaan yang ditampilkan.

Mengisi nama kelas pada profil tidak sama dengan bergabung ke kelas backend. Keanggotaan kelas dibentuk melalui undangan yang sah.

### 12.2 Mengerjakan penugasan

1. Buka menu **Tugas**.
2. Pilih tugas yang diterbitkan untuk kelas atau akun siswa tersebut.
3. Baca judul dan arahan guru.
4. Mulai dari tautan tugas agar kegiatan terhubung ke penugasan yang benar.
5. Ikuti instruksi dan pertanyaan; sebagian teks dapat disesuaikan guru.
6. Selesaikan kegiatan dan kirim hasilnya.
7. Buka hasil atau Progres untuk memeriksa riwayat.

Mengerjakan kegiatan langsung dari katalog tanpa konteks tugas tidak otomatis menghubungkan hasil tersebut ke tugas tertentu.

### 12.3 Ketika tugas belum muncul

Periksa apakah akun telah bergabung pada kelas yang benar, tugas sudah diterbitkan, dan pengguna termasuk penerima yang dipilih. Tugas yang ditujukan kepada siswa tertentu tidak otomatis terlihat oleh seluruh siswa kelas.

## 13. Panduan guru dan pengelolaan kelas

### 13.1 Menyiapkan ruang sekolah

Pada akun online, peran guru mengikuti keanggotaan sekolah. Untuk membuat ruang pengajaran melalui antarmuka yang tersedia:

1. Login dan buka **Settings** → **Sekolah & kelas**.
2. Buka **Buat ruang sekolah untuk mengajar**.
3. Isi **Nama sekolah / ruang guru**.
4. Tekan **Buat ruang sekolah**.
5. Tunggu profil dan daftar keanggotaan diperbarui.
6. Periksa apakah ruang dan akses guru yang sesuai telah tersedia.

Jika sekolah sudah menggunakan ruang yang dikelola orang lain, koordinasikan keanggotaan dengan pengelola. Membuat ruang baru tidak memberi akses ke data ruang sekolah lain.

### 13.2 Membuat kelas

1. Buka bagian **Sekolah & kelas** setelah memiliki keanggotaan guru.
2. Pilih sekolah yang dikelola.
3. Isi **Nama kelas**.
4. Tekan **Buat kelas**.
5. Periksa kelas pada daftar.

### 13.3 Membuat undangan siswa

1. Cari kelas milik guru pada daftar kelas.
2. Tekan **Buat kode undangan**.
3. Salin kode yang ditampilkan.
4. Bagikan kepada siswa kelas tersebut melalui saluran sekolah.
5. Minta siswa memasukkan kode pada Settings akun masing-masing.

Antarmuka saat ini membuat undangan dengan batas 100 penggunaan dan menampilkan masa berlaku tujuh hari. Kode yang kedaluwarsa atau mencapai batas penggunaan perlu diganti melalui pembuatan undangan baru.

### 13.4 Membuat tugas

1. Buka **Ruang guru**.
2. Buka pembuatan tugas eksperimen.
3. Pilih eksperimen dari katalog.
4. Isi judul dan arahan.
5. Pilih kelas ketika tugas akan diterbitkan.
6. Periksa langkah simulasi awal. Kuis tidak ditambahkan secara otomatis.
7. Gunakan **Tambah langkah** untuk menambahkan bacaan atau pengamatan. Pada **Jenis langkah**, pilih bacaan dengan tombol Lanjutkan atau tindakan simulasi yang tersedia.
8. Hapus langkah yang tidak diperlukan melalui ikon tempat sampah.
9. Jika diperlukan, tekan **Tambah kuis** atau **Tambah kuis setelah ini**. Guru dapat menambahkan beberapa kuis, termasuk dua kuis berurutan.
10. Isi pertanyaan, 2?6 pilihan jawaban, kunci jawaban, dan penjelasan opsional. Gunakan **Tambah pilihan** atau ikon hapus pilihan untuk mengatur jumlahnya.
11. Simpan tugas. Tugas tanpa kuis tetap dapat disimpan dan diselesaikan.

Satu tugas dapat memuat hingga 100 langkah dan kuis. Progres siswa mengikuti seluruh tahap yang disusun guru; hasil kuis mengikuti pertanyaan yang benar-benar ditambahkan.

Guru menggunakan tahapan dari eksperimen yang sudah tersedia. Pembuat tugas bukan editor untuk menciptakan engine simulasi baru atau menambahkan sembarang alat di luar katalog.

### 13.5 Menentukan penerima

| Pilihan        | Perilaku                                                                         |
| -------------- | -------------------------------------------------------------------------------- |
| Seluruh kelas  | Tugas diterbitkan kepada penerima kelas sesuai daftar pada saat publikasi        |
| Siswa tertentu | Guru memilih siswa dari kelas; hanya penerima terpilih yang mendapat akses tugas |

Pilih setidaknya satu siswa jika memakai penerima individual. Jika daftar siswa kosong, periksa apakah siswa telah bergabung ke kelas.

### 13.6 Draft dan publikasi

**Draft** menyimpan persiapan tugas sebelum diterbitkan. Untuk langsung menerbitkan dari pembuat tugas, gunakan pilihan **Terbitkan untuk penerima yang dipilih**, lengkapi kelas/penerima, lalu tekan **Simpan tugas**.

Jika tugas telah disimpan sebagai draft, buka halaman laporan/detailnya, tentukan kelas dan penerima, lalu tekan **Terbitkan tugas**.

Publikasi membekukan konfigurasi dan penerima tugas untuk menjaga konsistensi penilaian. Siswa yang bergabung belakangan tidak boleh diasumsikan otomatis menjadi penerima publikasi lama. Periksa daftar penerima pada laporan.

### 13.7 Membaca laporan

1. Buka tugas dari **Ruang guru**.
2. Baca status tugas dan arahan.
3. Lihat ringkasan penerima serta penyelesaian.
4. Periksa hasil siswa yang telah tersedia.
5. Gunakan halaman lanjutan laporan jika ditampilkan.
6. Pelajari bagian pemahaman yang perlu dibahas untuk merencanakan tindak lanjut.

Ringkasan penyelesaian memakai siswa penerima yang berbeda, bukan sekadar jumlah percobaan. Nilai terbaik dari attempt selesai digunakan dalam rekap tugas.

### 13.8 Ekspor CSV

Pada laporan akun untuk tugas yang sudah diterbitkan:

1. Klik **Ekspor seluruh hasil CSV**.
2. Tunggu pengambilan seluruh halaman laporan selesai.
3. Simpan file yang diunduh.
4. Buka dengan aplikasi spreadsheet untuk meninjau data.
5. Simpan dan bagikan sesuai pengelolaan data siswa di sekolah.

Ekspor tersebut berbeda dari tombol ekspor yang tersedia pada demonstrasi lokal. Jika tugas masih draft atau belum ada data, periksa status dan isi laporan terlebih dahulu.

## 14. Settings, bantuan, dan notifikasi

### 14.1 Profil

1. Buka **Settings**.
2. Perbarui nama pada **Profil kamu**.
3. Jika tersedia, isi kelas atau kelompok sebagai informasi profil.
4. Simpan dan periksa pesan keberhasilan.

Nama kelas yang diketik pada profil bukan bukti keanggotaan kelas dan tidak memberikan hak mengakses tugas.

### 14.2 Kata sandi dan foto profil

Akun online menyediakan pengubahan kata sandi melalui bagian **Kata sandi**. Isi kata sandi baru sesuai persyaratan yang ditampilkan, simpan, dan tunggu pesan berhasil.

Bagian **Foto profil** menerima PNG, JPEG, atau WebP dengan ukuran maksimal 2 MB. Pilih file yang sesuai dan periksa hasil unggahan. Avatar akun menggunakan penyimpanan privat dan akses yang disiapkan aplikasi bagi pemiliknya.

### 14.3 Bantuan

Ikon bantuan pada header membuka panduan penggunaan yang tersedia. Ruang eksperimen juga memiliki bantuan khusus, seperti **Butuh petunjuk?** atau **Bantuan & teori**. Gunakan bantuan khusus untuk memahami tindakan pada langkah saat ini.

### 14.4 Notifikasi

Buka ikon lonceng pada header untuk melihat notifikasi. Notifikasi akun dimuat dari layanan aplikasi dan status bacanya disimpan melalui layanan tersebut. Notifikasi demo dibentuk dari data lokal. Daftar kosong berarti belum ada notifikasi yang tersedia bagi pengguna pada konteks tersebut.

## 15. Penyimpanan dan sinkronisasi

### 15.1 Data lokal dan data akun

| Data                   | Mode demo/tamu pada fitur yang mendukungnya | Akun online                                                  |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Profil demo            | Browser                                     | Identitas diverifikasi layanan Auth                          |
| Sesi tantangan         | Penyimpanan lokal                           | State sesi terkonfirmasi di backend                          |
| Hasil tantangan        | Riwayat lokal demo                          | Hasil penilaian server                                       |
| Konfigurasi eksplorasi | Browser atau memori jika storage diblokir   | Layanan penyimpanan konfigurasi pada fitur yang mendukungnya |
| Catatan lab            | Data lokal                                  | API catatan milik pengguna                                   |
| Tugas demo             | Browser                                     | Draft, publikasi, dan penerima di backend                    |

Tidak ada alur yang dijelaskan di buku ini untuk memindahkan seluruh data demo menjadi nilai resmi akun. Login akun online tidak boleh dianggap sebagai migrasi otomatis data demo.

### 15.2 Menunggu penyimpanan

Pada tantangan akun, tindakan memiliki identitas event untuk pengiriman ulang dan revision untuk menjaga konsistensi sesi. Tampilan alat dapat berubah lebih dahulu, lalu aplikasi menyesuaikannya dengan respons server.

Pada eksplorasi akun, konfigurasi bermakna disimpan berkala; dokumentasi implementasi menetapkan interval autosave sekitar lima detik. Frame animasi tidak dikirim sebagai data penyimpanan. Gunakan indikator status atau tombol Simpan ketika tersedia sebelum berpindah perangkat.

### 15.3 Konflik antarperangkat

Jika sesi yang sama diubah dari perangkat lain, aplikasi dapat meminta pengguna melanjutkan dari state terbaru. Pada eksplorasi, kontrol **Muat simpanan akun** dan **Pulihkan draf konflik** tersedia untuk alur pemulihan yang mendukungnya.

Muat versi akun sebelum memutuskan memulihkan draf perangkat. Hindari mengerjakan satu sesi secara bersamaan pada beberapa perangkat karena perubahan dapat saling bertentangan.

### 15.4 Menutup sesi dengan benar

1. Pastikan tidak ada pesan gagal simpan.
2. Tunggu sinkronisasi atau pengiriman hasil selesai.
3. Ekspor catatan yang diperlukan.
4. Logout pada perangkat bersama.

Jika penyimpanan browser diblokir, sebagian data hanya berada di memori sampai halaman ditutup. Ikuti pemberitahuan aplikasi dan ekspor sebelum keluar.

## 16. Pemecahan masalah

| Masalah                                   | Hal yang perlu diperiksa                                                    | Tindakan                                                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Email konfirmasi belum diterima           | Alamat email, folder spam, dan layanan pengiriman                           | Periksa email; jika tetap gagal, pengelola memeriksa Auth/SMTP                                                                  |
| Konfirmasi membuka localhost              | `APP_URL`, Site URL, callback yang diizinkan, dan template email            | Pengelola mengikuti konfigurasi produksi pada Bab 18; gunakan tautan baru setelah konfigurasi benar                             |
| Login gagal                               | Email, kata sandi, dan verifikasi email                                     | Periksa data login atau gunakan Lupa password                                                                                   |
| Formulir menyebut profil lokal            | Backend/Auth belum dikonfigurasi                                            | Gunakan demo atau minta pengelola menghubungkan layanan akun                                                                    |
| Alat tidak dapat diletakkan               | Item, target drop, posisi pointer, dan langkah saat ini                     | Baca instruksi; gunakan tombol tindakan sebagai alternatif                                                                      |
| Aksi berikutnya belum aktif               | Sesi belum dimuat atau tindakan akun masih disinkronkan                     | Tunggu status selesai; periksa jaringan jika muncul error                                                                       |
| Tindakan gagal setelah alat sempat tampil | Respons server gagal/ditolak                                                | Ikuti pesan dan ulangi tindakan; tampilan sebelumnya bukan bukti sudah tersimpan                                                |
| Halaman meminta login                     | Halaman membutuhkan identitas                                               | Login atau pilih demo siswa/guru sesuai kebutuhan                                                                               |
| Tugas tidak terlihat                      | Publikasi, keanggotaan kelas, dan daftar penerima                           | Guru memeriksa status tugas dan penerima                                                                                        |
| Ruang guru tidak muncul                   | Peran akun berdasarkan keanggotaan sekolah                                  | Periksa ruang sekolah di Settings; pilihan demo guru bukan hak guru online                                                      |
| Data demo hilang                          | Browser berbeda, mode privat, storage terhapus/diblokir                     | Gunakan browser yang sama; data yang sudah terhapus tidak dijamin dapat dipulihkan                                              |
| Progres belum bertambah                   | Hasil belum dikirim, penyimpanan gagal, atau hanya mencoba eksplorasi bebas | Selesaikan tantangan dan kirim hasil; periksa pesan penyimpanan                                                                 |
| Foto profil ditolak                       | Format dan ukuran file                                                      | Gunakan PNG/JPEG/WebP maksimal 2 MB                                                                                             |
| Sesi diperbarui dari perangkat lain       | Ada perubahan pada sesi yang sama                                           | Ikuti langkah terbaru yang dimuat aplikasi                                                                                      |
| Terlalu banyak permintaan                 | Pembatasan API atau layanan Auth                                            | Tunggu sesuai pesan; jangan terus mengirim ulang                                                                                |
| Browser tertutup saat mengetik email      | Perlu pemeriksaan browser, autofill, ekstensi, atau laporan crash           | Catat browser/OS dan langkah kejadian; bandingkan pada profil bersih atau browser lain tanpa menganggap penyebabnya sudah pasti |

### 16.1 Informasi untuk melaporkan masalah

Sertakan halaman, kegiatan, mode demo/akun, browser, sistem operasi, tindakan sebelum masalah, dan teks error. Jika tersedia, sertakan `requestId` untuk membantu pengelola mencari permintaan pada log.

Jangan memasukkan kata sandi, kode pemulihan, token undangan privat, atau secret server dalam laporan masalah.

### 16.2 Mengapa tindakan akun dapat terasa lambat?

Tindakan akun membutuhkan sinkronisasi state ke backend. Kecepatan dipengaruhi jaringan dan layanan server. Pada implementasi yang menjadi acuan buku ini, penempatan alat sudah ditampilkan lebih dahulu oleh frontend, tetapi penyimpanan dan tindakan lanjutan tetap mengikuti pengakuan server. Ini berbeda dari mode demo yang menggunakan state lokal untuk tindakan alat.

## 17. Panduan instalasi untuk pengembang

Bab ini ditujukan bagi pengembang atau pengelola teknis. Pengguna aplikasi produksi tidak perlu menjalankan perintah berikut.

### 17.1 Komponen proyek

| Komponen             | Peran                                         |
| -------------------- | --------------------------------------------- |
| Next.js dan React    | Halaman, navigasi, antarmuka, dan runtime API |
| TypeScript           | Tipe, kontrak data, dan implementasi fitur    |
| CSS, SVG, dan Canvas | Tampilan serta visualisasi                    |
| dnd-kit              | Interaksi drag-and-drop                       |
| Supabase Auth        | Autentikasi akun                              |
| PostgreSQL/Supabase  | Penyimpanan dan pembatasan akses data         |
| Supabase Storage     | Aset akun seperti avatar privat               |

Frontend dan backend dijalankan dalam satu deployment Next.js. Browser memanggil adapter API, sedangkan modul server menangani identitas, otorisasi, sesi, dan penilaian.

### 17.2 Struktur repository

```text
labora/
├── frontend/
│   ├── app/              Rute Next.js, adapter API, dan stylesheet
│   ├── application/      Shell, pemetaan halaman, dan state aplikasi
│   ├── features/         Fitur UI dan aplikasi per domain
│   ├── public/           Gambar, logo, maskot, dan aset
│   ├── tests/            Pengujian domain, API, UI, dan browser
│   └── .env.example      Contoh konfigurasi server
├── backend/
│   ├── modules/          Modul server per domain
│   ├── shared/           Infrastruktur dan validasi server
│   └── supabase/         Konfigurasi dan migrasi database
├── shared/               Kontrak dan engine eksperimen bersama
└── manualbook.md         Buku panduan ini
```

### 17.3 Prasyarat

- Source repository lengkap, termasuk `backend/` dan `shared/`.
- Node.js dan npm yang kompatibel dengan dependency proyek; Node.js 22 atau 24 dapat dipakai sebagai lingkungan pengembangan proyek ini.
- Terminal untuk instalasi dan menjalankan aplikasi.
- Docker serta Supabase CLI jika menjalankan database Supabase lokal.
- Project Supabase dan akses konfigurasi yang sesuai jika menghubungkan backend hosted.

### 17.4 Menjalankan frontend

Dari root repository:

```sh
cd frontend
npm ci
npm run dev
```

Buka `http://localhost:3000`. Untuk mencoba tanpa layanan akun, gunakan tombol demo pada halaman login. Saat backend belum dikonfigurasi, form tertentu membuat profil lokal, bukan akun online.

### 17.5 Environment server

Salin `frontend/.env.example` menjadi `frontend/.env.local`. Contoh pada PowerShell dari root repository:

```powershell
Copy-Item -LiteralPath frontend/.env.example -Destination frontend/.env.local
```

Isi dengan konfigurasi milik lingkungan yang digunakan:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
APP_URL=http://localhost:3000
TRUST_PROXY=0
```

Semua nilai di atas adalah contoh atau placeholder. `SUPABASE_URL` berupa origin project, tanpa `/rest/v1/`. Secret hanya untuk server; jangan memberikan prefix `NEXT_PUBLIC_`, memasukkannya ke browser, atau menyimpannya dalam Git. Untuk development, `APP_URL` juga dapat dikosongkan agar menggunakan origin permintaan. Restart server setelah mengubah environment lokal.

### 17.6 Database lokal

Migrasi resmi berada di `backend/supabase/migrations/`. `schema.sql` lama bukan skrip instalasi yang digunakan untuk implementasi ini.

Dari folder `backend/`, dengan Docker berjalan, dokumentasi proyek menggunakan:

```sh
npx --yes supabase@2.119.0 start
npx --yes supabase@2.119.0 migration list --local
```

Untuk membangun ulang **database lokal yang boleh dibuang**, dokumentasi proyek menyediakan:

```sh
npx --yes supabase@2.119.0 db reset --local --yes
```

Perintah reset menghapus data database lokal dan mengaplikasikan ulang migrasi/seed. Jangan menjalankannya pada data yang harus dipertahankan atau menggunakan reset sebagai prosedur deployment produksi. Verifikasi versi CLI dan opsi lewat `--help` ketika lingkungan berbeda dari versi yang didokumentasikan.

### 17.7 Build dan server produksi lokal

Dari `frontend/`:

```sh
npm run build
npm run start
```

Build membuat artefak Next.js untuk runtime server. Proyek ini membutuhkan adapter API; export HTML statis saja tidak menyediakan backend.

### 17.8 Pemeriksaan perubahan

| Perintah dari `frontend/`    | Tujuan                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| `npm run typecheck`          | Memeriksa tipe TypeScript                                  |
| `npm run check:architecture` | Memeriksa batas modul dan ketergantungan                   |
| `npm run format:check`       | Memeriksa format file sesuai konfigurasi                   |
| `npm test`                   | Menjalankan pengujian domain dan simulasi yang terdaftar   |
| `npm run test:api`           | Menjalankan pengujian API yang terdaftar                   |
| `npm run test:ui`            | Menjalankan pengujian UI yang terdaftar                    |
| `npm run test:browser`       | Menjalankan suite browser; membutuhkan server dan Chromium |
| `npm run build`              | Memeriksa build produksi                                   |

Persiapan browser dilakukan dengan `npx playwright install chromium`. Server aplikasi harus sudah berjalan. Gunakan `LABORA_BASE_URL` jika alamatnya berbeda dari default `http://localhost:3000`.

Tes integrasi akun/database memiliki prasyarat lingkungan Supabase lokal tersendiri. Jangan menganggap setiap suite dapat dijalankan pada database produksi; beberapa fixture memang menolak host remote. Ikuti `backend/README.md` untuk lingkungan dan cakupan pengujiannya.

## 18. Deployment dan pengelolaan layanan

### 18.1 Hosting

Deployment Vercel proyek memakai pengaturan berikut:

| Pengaturan          | Nilai                                                        |
| ------------------- | ------------------------------------------------------------ |
| Framework           | Next.js                                                      |
| Root Directory      | `frontend`                                                   |
| Sumber di luar root | Diikutsertakan agar import `backend/` dan `shared/` tersedia |
| Install Command     | `npm ci`                                                     |
| Build Command       | `npm run build`                                              |
| Output Directory    | Default Next.js                                              |
| Production Branch   | `main`                                                       |

Saat menetapkan root, pastikan source di luar root tetap tersedia untuk build. Mekanisme ini dijelaskan dalam [Vercel Monorepos FAQ](https://vercel.com/docs/monorepos/monorepo-faq).

Untuk provider lain, instalasi/build tetap berasal dari `frontend/`, seluruh repository tersedia, dan layanan menjalankan runtime Node/Next.js.

### 18.2 Konfigurasi produksi

Masukkan environment melalui dashboard hosting atau secret manager. Untuk domain proyek saat ini:

```dotenv
APP_URL=https://labora-mu.vercel.app
```

Gunakan Supabase URL, publishable key, dan secret key dari project yang sama. Pisahkan lingkungan preview/staging dari data sekolah produksi. `TRUST_PROXY=1` hanya dipakai pada proxy selain Vercel yang telah dikonfigurasi menimpa header IP sesuai dokumentasi proyek.

Redeploy setelah perubahan environment produksi. Menyalin `APP_URL=http://localhost:3000` dari development ke produksi dapat mengarahkan tautan email ke perangkat pengguna dan mengganggu validasi origin.

### 18.3 Site URL dan callback Auth

Di konfigurasi URL Supabase Auth:

1. Tetapkan **Site URL** ke `https://labora-mu.vercel.app`.
2. Tambahkan callback pendaftaran: `https://labora-mu.vercel.app/api/v1/auth/confirm`.
3. Tambahkan callback pemulihan: `https://labora-mu.vercel.app/api/v1/auth/confirm?recovery=1`.
4. Tambahkan callback localhost hanya jika pengujian akun lokal diperlukan.
5. Pertahankan parameter pemulihan dan gunakan template email yang cocok dengan alur aplikasi.
6. Uji email yang benar-benar terkirim setelah konfigurasi diubah.

Site URL menentukan redirect default, sedangkan tujuan redirect aplikasi perlu diizinkan dalam konfigurasi. Pengaturan ini penting untuk konfirmasi dan pemulihan email; lihat [panduan Redirect URLs Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

Pada template standar, gunakan tautan konfirmasi yang disediakan layanan. Jangan hardcode localhost pada template. Perubahan `config.toml` lokal tidak otomatis mengubah konfigurasi project Supabase hosted.

### 18.4 Email dan SMTP

Pengelola perlu mengonfigurasi layanan pengiriman email untuk penggunaan produksi, termasuk identitas pengirim dan konfigurasi SMTP yang sesuai. Verifikasi setidaknya pendaftaran, konfirmasi, pemulihan kata sandi, dan pergantian kata sandi melalui HTTPS. Keberhasilan mode demo bukan bukti bahwa email produksi telah bekerja.

### 18.5 Keamanan yang diterapkan dalam kode

- Identitas akun diperiksa pada server menggunakan sesi Auth.
- Cookie produksi menggunakan pengaturan HTTP-only dan Secure.
- Akses data dibatasi melalui pemeriksaan server dan Row Level Security.
- Peran sekolah mengikuti membership, bukan pilihan profil yang dapat diedit pengguna.
- Penilaian akun dan operasi sensitif dilakukan pada server.
- Tindakan sesi memakai event ID dan revision untuk retry serta konsistensi.
- Login, pendaftaran, dan API menggunakan pembatasan permintaan sesuai endpoint.
- Secret dan kunci jawaban penilaian tidak menjadi data publik browser.
- Avatar akun menggunakan bucket privat.

Daftar ini menjelaskan mekanisme implementasi, bukan sertifikat bahwa seluruh aplikasi bebas kerentanan. Konfigurasi hosting, kebijakan Auth, pengelolaan secret, dependensi, dan pengujian akses tetap merupakan bagian pekerjaan operasional.

### 18.6 Pemeriksaan layanan dan backup

Pengelola memeriksa status hosting, log permintaan, kegagalan Auth/email, serta pesan penyimpanan yang dilaporkan pengguna. Gunakan request ID untuk menghubungkan laporan dengan log jika tersedia.

Sebelum migrasi produksi, siapkan backup yang sesuai, tinjau kompatibilitas perubahan, dan catat versi migrasi. Uji pemulihan pada lingkungan terpisah. Rencana dan retensi backup mengikuti layanan serta konfigurasi yang benar-benar digunakan; kode aplikasi tidak menjamin backup produksi telah diaktifkan.

## 19. Skenario demonstrasi dan pemeriksaan

### 19.1 Demonstrasi untuk presentasi proyek

Urutan berikut memperlihatkan fitur inti tanpa mewajibkan penonton menunggu email verifikasi:

1. Tampilkan landing dan jelaskan tiga bidang sains.
2. Masuk sebagai demo siswa.
3. Tampilkan Beranda dan halaman Tantangan.
4. Buka Asam dan Basa, baca ringkas tujuan, dan mulai kegiatan.
5. Tunjukkan drag-and-drop serta alternatif tombol tindakan.
6. Selesaikan pertanyaan dan tampilkan hasil/Progres.
7. Tampilkan satu simulasi bebas Fisika dan satu preparat Biologi.
8. Masuk sebagai demo guru pada sesi demonstrasi yang sesuai.
9. Tunjukkan pembuatan tugas dan bentuk laporannya.
10. Jelaskan bahwa pembagian tugas lintas akun menggunakan kelas backend, bukan data demo lokal.

Untuk mendemonstrasikan sinkronisasi akun, siapkan akun siswa/guru dan kelas uji sebelumnya. Hindari memakai data siswa nyata dalam presentasi publik.

### 19.2 Checklist pengguna

- [ ] Dapat membuka aplikasi dan masuk pada mode yang dipilih.
- [ ] Memahami perbedaan Eksperimen dan Tantangan.
- [ ] Dapat membuka detail dan kembali ke halaman asal.
- [ ] Dapat menggunakan tombol tindakan atau drag-and-drop.
- [ ] Dapat menyelesaikan pertanyaan dan melihat hasil.
- [ ] Dapat membuka Progres.
- [ ] Mengetahui lokasi catatan atau ekspor pada fitur yang mendukungnya.

### 19.3 Checklist guru

- [ ] Memiliki akses guru pada sekolah yang benar.
- [ ] Kelas dan keanggotaan siswa sudah tersedia.
- [ ] Instruksi serta pertanyaan tugas sudah diperiksa.
- [ ] Penerima kelas/individual sudah benar.
- [ ] Tugas telah diterbitkan.
- [ ] Siswa penerima dapat membuka dan menyelesaikan tugas.
- [ ] Laporan dan CSV dapat dibuka sesuai akses.

### 19.4 Checklist pengelola sebelum dipakai kelas

- [ ] Environment produksi menunjuk domain dan Supabase project yang benar.
- [ ] Konfirmasi email dan pemulihan kembali ke domain yang benar.
- [ ] Login, refresh sesi, dan logout bekerja pada HTTPS.
- [ ] Akun siswa yang bukan penerima ditolak dari tugas terbatas.
- [ ] Hasil tersimpan dan dapat dibuka kembali.
- [ ] Tampilan desktop/mobile dan kontrol alternatif telah diperiksa.
- [ ] Log serta prosedur laporan masalah tersedia.
- [ ] Backup dan pemulihan memiliki prosedur yang sesuai lingkungan.

## 20. Lampiran

### 20.1 Daftar rute utama

Rute ditulis relatif terhadap domain aplikasi. Penulisan `[id]` menunjukkan nilai ID yang diganti oleh aplikasi.

| Rute                    | Halaman                                      |
| ----------------------- | -------------------------------------------- |
| `/`                     | Landing                                      |
| `/login`                | Login dan akses demo                         |
| `/register`             | Pendaftaran                                  |
| `/forgot-password`      | Pemulihan kata sandi                         |
| `/dashboard`            | Beranda                                      |
| `/laboratories`         | Pilihan lab                                  |
| `/kimia`                | Pintu masuk kegiatan Kimia                   |
| `/sandbox/chemistry`    | Eksplorasi meja Kimia                        |
| `/fisika`               | Pilihan lima simulasi Fisika                 |
| `/fisika/[id]`          | Simulasi Fisika yang dipilih                 |
| `/sandbox/biology`      | Ruang eksplorasi Biologi                     |
| `/challenges`           | Katalog tantangan                            |
| `/experiments/[id]`     | Detail eksperimen terpandu                   |
| `/challenges/run/[id]`  | Pengerjaan eksperimen terpandu               |
| `/results/[id]`         | Halaman hasil berdasarkan konteks eksperimen |
| `/progress`             | Progres dan riwayat                          |
| `/assignments`          | Tugas                                        |
| `/teacher`              | Ruang guru                                   |
| `/teacher/new`          | Pembuat tugas                                |
| `/teacher/results/[id]` | Laporan tugas guru                           |
| `/settings`             | Profil dan pengaturan akun                   |

Akses tetap diperiksa aplikasi. Mengetahui atau mengganti URL tidak memberikan hak tambahan terhadap data akun lain.

### 20.2 Glosarium

| Istilah          | Arti dalam Labora                                                    |
| ---------------- | -------------------------------------------------------------------- |
| Akun online      | Identitas pengguna yang diverifikasi layanan Auth                    |
| Demo             | Pengalaman latihan berbasis data browser                             |
| Eksperimen bebas | Kegiatan eksplorasi tanpa urutan penilaian wajib                     |
| Tantangan        | Kegiatan terpandu dengan langkah dan pertanyaan                      |
| Preparat         | Sampel atau representasi bahan yang diamati dengan mikroskop         |
| Hipotesis        | Perkiraan sebelum percobaan                                          |
| Pengamatan       | Informasi yang terlihat atau terbaca dalam percobaan                 |
| Attempt          | Satu pengerjaan eksperimen yang menghasilkan sesi/hasil              |
| Draft            | Tugas yang disimpan tetapi belum diterbitkan                         |
| Penerima         | Siswa yang menjadi sasaran publikasi tugas                           |
| Sinkronisasi     | Penyesuaian data perangkat dengan data akun di server                |
| Revision         | Versi state yang dipakai untuk mencegah perubahan saling menimpa     |
| Event ID         | Identitas tindakan agar pengiriman ulang tidak menggandakan tindakan |
| CSV              | File tabel untuk ekspor laporan                                      |
| SVG              | File gambar vektor untuk ekspor representasi meja                    |
| RLS              | Aturan pembatasan akses pada baris database                          |

### 20.3 Format catatan percobaan

```text
Judul kegiatan:
Tanggal:
Nama / kelompok:
Tujuan:
Variabel yang diubah:
Variabel yang dipertahankan:
Hipotesis:
Langkah yang dilakukan:
Pengamatan / hasil pengukuran:
Kesimpulan:
Batas model atau hal yang perlu diperiksa kembali:
```

Format ini dapat disalin ke laporan pembelajaran. Pada buku catatan aplikasi, gunakan kolom yang benar-benar tersedia; tambahan kolom dapat ditulis dalam laporan terpisah.

### 20.4 Menyiapkan Markdown menjadi PDF

Dokumen ini memakai heading bernomor, daftar isi dengan anchor, tabel, dan blok perintah. Nomor halaman tidak dicantumkan karena berubah mengikuti alat konversi dan pengaturan cetak.

1. Buka `manualbook.md` dengan editor atau renderer Markdown yang mendukung ekspor/cetak.
2. Render Markdown terlebih dahulu; jangan mencetak teks Markdown mentah.
3. Gunakan ekspor PDF atau cetak hasil render ke PDF.
4. Atur kertas A4, orientasi portrait, dan margin sekitar 15–20 mm.
5. Gunakan ukuran teks isi sekitar 10–11 pt sebagai pengaturan awal, lalu periksa keterbacaan tabel.
6. Tambahkan nomor halaman melalui alat ekspor bila tersedia.
7. Periksa daftar isi, pemenggalan tabel, blok perintah, tautan, dan karakter seperti `×` sebelum membagikan PDF.

Panduan ini menyiapkan sumber dokumen; file PDF belum dihasilkan sebagai bagian dari pembuatan buku ini.

### 20.5 Dokumen acuan proyek

- [README proyek](README.md): gambaran produk dan menjalankan aplikasi.
- [Arsitektur](ARCHITECTURE.md): struktur dan batas modul.
- [Setup backend](backend/README.md): database, otorisasi, penyimpanan, dan pengujian.
- [Panduan produksi](backend/PRODUCTION.md): hosting dan konfigurasi layanan.
- [Design system](designSystem.md): identitas visual dan prinsip desain.
- [Dokumentasi desain implementasi](DESIGN.md): token dan komponen antarmuka.

Tautan relatif di atas mengacu ke repository. Untuk PDF yang dibagikan tanpa repository, pembaca tetap dapat mengikuti panduan penggunaan dalam buku ini; dokumen teknis pendukung dapat disertakan sebagai lampiran terpisah.

---

**Akhir Manual Book Labora — Edisi 1.0**
