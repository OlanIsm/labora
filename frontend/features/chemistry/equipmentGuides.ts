import { EquipmentGuide } from "../../lib/sandbox/equipmentGuides";

export const chemistryGuides: Record<string, EquipmentGuide> = {
  "litmus-red": {
    purpose: "Lakmus merah menguji sifat asam/basa. Kertas berubah biru dalam larutan basa; larutannya tidak diwarnai.",
    usage: "Seret dan lepaskan kertas di atas cairan. Kertas langsung dicelupkan dan warna strip diperbarui otomatis, tanpa menekan tombol.",
    limitation: "Lakmus tidak mengukur pH tepat. Pada rentang peralihan pH 4,5–8,3, model mempertahankan warna kertas sebelumnya.",
  },
  "litmus-blue": {
    purpose: "Lakmus biru menguji sifat asam/basa. Kertas berubah merah dalam larutan asam; larutannya tidak diwarnai.",
    usage: "Seret dan lepaskan kertas di atas cairan. Kertas langsung dicelupkan dan warna strip diperbarui otomatis, tanpa menekan tombol.",
    limitation: "Lakmus tidak mengukur pH tepat. Pada rentang peralihan pH 4,5–8,3, model mempertahankan warna kertas sebelumnya.",
  },
  beaker: {
    purpose: "Gelas kimia menampung dan mencampur bahan. Skalanya bukan untuk mengukur volume secara teliti.",
    usage: "Seret bahan ke gelas. Pilih gelas untuk menuang isinya, mengaduk, atau menyambungkan alat ukur.",
  },
  "test-tube": {
    purpose: "Tabung reaksi menampung sedikit bahan untuk mengamati perubahan warna, endapan, atau gas.",
    usage: "Seret bahan ke tabung. Letakkan tabung di slot rak; seret keluar atau pilih Keluarkan dari rak untuk mengambilnya kembali.",
  },
  erlenmeyer: {
    purpose: "Labu Erlenmeyer menampung larutan. Lehernya yang sempit membantu mengurangi percikan saat larutan digoyangkan.",
    usage: "Tambahkan bahan, lalu pilih labu untuk menuang atau mengaduk isinya.",
    limitation: "Bentuk leher dan gerakan menggoyangkan belum memengaruhi simulasi. Labu memakai model wadah umum.",
  },
  cylinder: {
    purpose: "Gelas ukur digunakan untuk mengukur volume cairan.",
    usage: "Tambahkan cairan, lalu buka Hasil pengamatan untuk membaca Volume (mL).",
    limitation: "Pembacaan meniskus dan ketidakpastian skala belum disimulasikan.",
  },
  burette: {
    purpose: "Buret meneteskan larutan dengan volume terukur, biasanya untuk titrasi. Statif menahan buret agar tegak.",
    usage: "Isi buret, pilih wadah tujuan, atur Jumlah bahan (mL), lalu tekan Tuang / campur.",
    limitation: "Kran, aliran tetes, dan pembacaan volume awal-akhir belum dimodelkan. Pemindahan memakai jumlah yang kamu masukkan.",
  },
  "evaporating-dish": {
    purpose: "Cawan penguap menampung larutan saat pelarut diuapkan untuk menyisakan zat terlarut.",
    usage: "Masukkan larutan, naikkan suhu virtual atau sambungkan pembakar aktif, lalu pilih Perlakukan campuran dan Uapkan.",
    limitation: "Luas permukaan cawan belum memengaruhi laju penguapan.",
  },
  "watch-glass": {
    purpose: "Kaca arloji menampung sedikit sampel dan dapat menjadi penutup gelas kimia di laboratorium nyata.",
    usage: "Di sini kaca arloji bisa menampung dan memindahkan bahan seperti wadah kecil.",
    limitation: "Kaca arloji belum bisa dipasang sebagai penutup gelas.",
  },
  "water-bath": {
    purpose: "Penangas air memanaskan sampel secara tidak langsung melalui air di sekeliling wadah sampel.",
    usage: "Saat ini kamu bisa mengisi wadah penangas dan mengubah suhu virtualnya.",
    limitation: "Wadah sampel belum bisa dimasukkan ke penangas. Pemanasan tidak langsung belum tersedia; alat ini masih memakai model wadah umum.",
  },
  calorimeter: {
    purpose: "Kalorimeter membantu mempelajari kalor dari perubahan suhu suatu campuran.",
    usage: "Campurkan bahan dengan suhu berbeda, lalu sambungkan termometer untuk membaca suhu campuran.",
    limitation: "Belum ada model isolasi atau kapasitas kalor dinding kalorimeter. Perhitungan memakai pencampuran termal umum.",
  },
  dropper: {
    purpose: "Pipet tetes memindahkan sedikit cairan, misalnya untuk menambahkan indikator.",
    usage: "Tuang sedikit cairan ke pipet melalui Tuang / campur. Pilih pipet, wadah tujuan, dan jumlah cairan untuk memindahkannya.",
    limitation: "Gerakan menyedot dan tetesan satu per satu belum tersedia. Cairan di pipet belum ditampilkan secara khusus.",
  },
  rack: {
    purpose: "Rak tabung reaksi menahan tabung tetap tegak dan membantu menata beberapa percobaan.",
    usage: "Seret tabung ke salah satu dari tiga slot kosong. Tabung ikut saat rak digeser dan bisa dikeluarkan tanpa kehilangan isinya.",
  },
  funnel: {
    purpose: "Corong dengan kertas saring membantu memisahkan padatan tak larut dari cairan.",
    usage: "Pilih wadah campuran, sambungkan wadah penerima, lalu pilih Perlakukan campuran dan Saring.",
    limitation: "Proses penyaringan dijalankan dari wadah, bukan dari corong. Memasang corong belum memengaruhi hasilnya.",
  },
  stirrer: {
    purpose: "Batang pengaduk membantu mencampur bahan dalam wadah.",
    usage: "Pilih wadah berisi bahan, buka Perlakukan campuran, lalu tekan Aduk.",
    limitation: "Batang ini belum bisa digunakan langsung pada wadah. Tombol Nyalakan pada batang pengaduk tidak menjalankan pengadukan.",
  },
  burner: {
    purpose: "Pembakar virtual memanaskan isi wadah yang tersambung.",
    usage: "Sambungkan pembakar ke wadah, tekan Nyalakan / jalankan, lalu jalankan waktu simulasi untuk melihat perubahan suhu.",
    limitation: "Pemanasan memakai model sederhana. Jangan mencoba memanaskan campuran ini di dunia nyata.",
  },
  tripod: {
    purpose: "Kaki tiga dan kasa menyangga wadah di atas pembakar. Kasa membantu menyebarkan panas.",
    usage: "Di sini kaki tiga bisa diletakkan dan dipindahkan sebagai bagian dari susunan alat.",
    limitation: "Wadah belum bisa dipasang di atasnya. Kaki tiga belum memengaruhi pemanasan atau menyangga benda secara interaktif.",
  },
  thermometer: {
    purpose: "Termometer mengukur suhu, dalam derajat Celsius (°C).",
    usage: "Pilih wadah yang ingin diukur, tekan Sambungkan, lalu buka Hasil pengamatan untuk membaca suhu.",
  },
  balance: {
    purpose: "Timbangan digital mengukur massa bahan.",
    usage: "Sambungkan ke wadah dan buka Hasil pengamatan untuk membaca Massa isi (g).",
    limitation: "Yang ditampilkan hanya massa isi. Massa wadah dan proses menara (tare) belum dimodelkan.",
  },
  "ph-meter": {
    purpose: "pH meter membantu mengetahui apakah larutan bersifat asam, netral, atau basa.",
    usage: "Sambungkan ke wadah berisi larutan, lalu baca pH di Hasil pengamatan.",
    limitation: "Kalibrasi elektroda belum tersedia. Nilai pH mengikuti pendekatan model larutan, bukan pengukuran sampel nyata.",
  },
  stopwatch: {
    purpose: "Stopwatch mengukur selang waktu suatu kegiatan.",
    usage: "Di sini alat menampilkan Waktu (s) dari waktu simulasi. Tombol Jalankan dan Jeda di toolbar mengendalikan waktu tersebut.",
    limitation: "Belum ada mulai, berhenti, dan reset khusus stopwatch. Nilainya bukan selang waktu sejak stopwatch dipilih.",
  },
  "electrolyte-tester": {
    purpose: "Alat uji elektrolit membandingkan kemampuan larutan menghantarkan listrik.",
    usage: "Sambungkan ke wadah berisi larutan, lalu baca Daya hantar relatif di Hasil pengamatan.",
    limitation: "Nilai ini relatif, bukan konduktivitas terkalibrasi. Terang lampu dan gelembung pada elektroda belum mengikuti nilai pembacaan.",
  },
  electrolysis: {
    purpose: "Sel elektrolisis menggunakan arus listrik untuk menjalankan reaksi pada elektroda.",
    usage: "Sambungkan ke wadah berisi bahan yang didukung model, nyalakan sel, lalu jalankan waktu. Pilih wadah untuk melihat hasil pada katoda dan anoda.",
    limitation: "Hasil bergantung pada larutan dan elektroda. Model belum mencakup semua produk, terutama elektrolisis larutan garam; hasilnya perlu tinjauan guru.",
  },
  chromatography: {
    purpose: "Kertas kromatografi memisahkan komponen tinta karena tiap komponen bergerak berbeda bersama pelarut.",
    usage: "Tuang sampel Pewarna makanan / tinta ke kertas. Sambungkan ke wadah berisi air atau etanol, nyalakan kertas, lalu jalankan waktu simulasi.",
    limitation: "Jarak pigmen dan nilai Rf merupakan model ilustratif, bukan prediksi untuk tinta nyata. Gambar kertas belum mengikuti perkembangan pemisahan.",
  },
  balloon: {
    purpose: "Balon dapat membantu menunjukkan gas yang terbentuk dari suatu reaksi, misalnya fermentasi.",
    usage: "Sambungkan balon ke wadah yang menghasilkan gas. Buka Hasil pengamatan untuk melihat Gas terbentuk (mL).",
    limitation: "Saat ini balon membaca data wadah, belum menampung gas secara fisik. Gambar balon juga belum membesar mengikuti jumlah gas.",
  },
};
