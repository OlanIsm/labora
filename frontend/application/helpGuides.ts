export const helpGuides = [
  {
    id: "start",
    title: "Mulai eksperimen pertamamu",
    description: "Pilih lab dan mulai menjelajah.",
    steps: [
      "Buka Eksperimen di navigasi aplikasi.",
      "Pilih Kimia, Fisika, atau Biologi.",
      "Pilih alat, simulasi, atau preparat yang ingin kamu coba. Setiap lab punya panduan pengamatan.",
    ],
    href: "/laboratories",
    action: "Pilih laboratorium",
  },
  {
    id: "bench",
    title: "Menggunakan meja laboratorium",
    description: "Ambil alat, tuangkan bahan, lalu amati.",
    steps: [
      "Di Lab Kimia, klik alat pada rak atau seret ke meja.",
      "Pilih benda di meja untuk melihat pengaturannya. Tuang bahan ke wadah yang sesuai dan perhatikan hasil pengamatan.",
      "Gunakan Jalankan untuk proses yang memerlukan waktu. Batalkan tindakan atau Reset saat ingin mencoba lagi.",
    ],
    href: "/sandbox/chemistry",
    action: "Buka Lab Kimia",
  },
  {
    id: "microscope",
    title: "Mengamati dengan mikroskop",
    description: "Pilih preparat dan atur perbesaran.",
    steps: [
      "Buka Lab Biologi dan pilih preparat dengan tombol Amati, atau seret ke mikroskop.",
      "Pilih lensa objektif. Atur fokus dan cahaya agar struktur terlihat jelas.",
      "Ikuti panduan pengamatan untuk membandingkan sel dan mengenali strukturnya.",
    ],
    href: "/sandbox/biology",
    action: "Buka Lab Biologi",
  },
  {
    id: "challenge",
    title: "Mengikuti tantangan dan tugas",
    description: "Selesaikan langkah, jawab kuis, dan lihat hasil.",
    steps: [
      "Buka Tantangan untuk aktivitas terpandu, atau Tugas untuk tugas dari gurumu.",
      "Baca tujuan eksperimen. Ikuti instruksi; alat bisa diseret atau dipakai melalui tombol tindakan.",
      "Jawab pertanyaan berdasarkan pengamatanmu. Di langkah terakhir, pilih Lihat hasil eksperimen untuk menyimpan hasil.",
    ],
    href: "/challenges",
    action: "Lihat tantangan",
  },
  {
    id: "progress",
    title: "Melihat progres belajar",
    description: "Temukan hasil dan ulasan jawabanmu.",
    steps: [
      "Buka Progres untuk melihat eksperimen yang sudah diselesaikan.",
      "Pilih hasil eksperimen untuk membaca skor, pengamatan, dan penjelasan jawaban.",
      "Centang hijau di kartu menandakan eksperimen telah selesai. Kamu tetap bisa membukanya untuk mencoba lagi.",
    ],
    href: "/progress",
    action: "Lihat progres",
  },
];

export const teacherGuides = [
  {
    id: "teacher",
    title: "Membuat tugas untuk kelas",
    description: "Atur instruksi dan pertanyaan tanpa menulis kode.",
    steps: [
      "Buka Ruang guru, lalu pilih Buat tugas.",
      "Pilih eksperimen, isi judul dan kelas, lalu sesuaikan instruksi, petunjuk, dan pertanyaannya.",
      "Simpan tugas. Halaman hasil menampilkan penyelesaian, skor, dan jawaban yang perlu dibahas.",
    ],
    href: "/teacher/new",
    action: "Buat tugas",
  },
];
