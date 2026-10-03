import type { Subject } from "@/shared/subjectTypes";
export type { Subject } from "@/shared/subjectTypes";
export type Item = {
  id: string;
  name: string;
  kind: "tool" | "material";
  icon: string;
};
export type Question = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  phase?: "before" | "during" | "after";
};
export type Step = {
  instruction: string;
  hint: string;
  action: string;
  item?: string;
  question?: Question;
};
export type Experiment = {
  id: string;
  subject: Subject;
  title: string;
  subtitle: string;
  duration: number;
  objective: string;
  theory: string;
  equipment: string[];
  materials: string[];
  items: Item[];
  steps: Step[];
  concept: string;
  visual: string;
};

const item = (
  id: string,
  name: string,
  kind: Item["kind"],
  icon: string,
): Item => ({ id, name, kind, icon });
const q = (
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): Question => ({
  prompt,
  options,
  answer,
  explanation,
  phase: "during",
});

export const experiments: Experiment[] = [
  {
    id: "acid-base",
    subject: "chemistry",
    title: "Identifikasi Asam dan Basa",
    subtitle: "Kenali sifat larutan dari warnanya",
    duration: 12,
    objective: "Identifikasi sifat larutan menggunakan indikator pH universal.",
    theory:
      "Indikator berubah warna karena bentuk molekulnya berubah sesuai konsentrasi ion hidrogen. pH rendah bersifat asam, sedangkan pH tinggi bersifat basa. Bagan warna membantu kita memperkirakan pH tanpa alat ukur.",
    equipment: ["Gelas beker", "Pipet tetes", "Bagan pH"],
    materials: ["Larutan A", "Indikator universal"],
    concept:
      "Indikator berubah menjadi merah dalam larutan asam dengan pH sekitar 3.",
    visual: "ph",
    items: [
      item("beaker", "Gelas beker", "tool", "beaker"),
      item("dropper", "Pipet tetes", "tool", "dropper"),
      item("solution", "Larutan A", "material", "bottle"),
      item("indicator", "Indikator pH", "material", "drop"),
    ],
    steps: [
      {
        instruction: "Letakkan gelas beker di meja laboratorium.",
        hint: "Seret gelas beker dari daftar alat, atau pilih lalu letakkan di meja.",
        action: "place",
        item: "beaker",
      },
      {
        instruction: "Tuang Larutan A ke dalam gelas beker.",
        hint: "Seret Larutan A langsung ke gelas beker, atau pilih larutannya lalu jalankan aksi tuang.",
        action: "pour",
        item: "solution",
      },
      {
        instruction: "Tambahkan indikator pH ke dalam larutan.",
        hint: "Seret indikator langsung ke gelas beker, atau pilih indikatornya lalu jalankan aksi tambah.",
        action: "add",
        item: "indicator",
      },
      {
        instruction: "Amati warnanya dan tentukan sifat Larutan A.",
        hint: "Bandingkan warna merah dengan nilai pH yang ditampilkan.",
        action: "answer",
        question: q(
          "Mengapa indikator berubah warna?",
          [
            "Suhu larutan berubah",
            "Molekul indikator merespons konsentrasi ion hidrogen",
            "Gelas beker bereaksi dengan cairan",
            "Warna merah selalu berarti netral",
          ],
          1,
          "Bentuk molekul indikator berbeda pada pH yang berbeda. Dalam larutan asam ini, bentuk yang terlihat berwarna merah.",
        ),
      },
    ],
  },
  {
    id: "mixture",
    subject: "chemistry",
    title: "Reaksi Pembentukan Endapan",
    subtitle: "Amati endapan yang terbentuk",
    duration: 10,
    objective:
      "Kenali tanda terbentuknya zat baru saat dua larutan dicampurkan.",
    theory:
      "Saat ion-ion terlarut bergabung membentuk senyawa yang tidak larut, muncul padatan berupa endapan. Perubahan yang terlihat ini merupakan bukti terjadinya reaksi kimia.",
    equipment: ["Gelas beker", "Pipet tetes"],
    materials: ["Larutan A", "Larutan B"],
    concept: "Campuran kedua larutan membentuk endapan yang membuatnya keruh.",
    visual: "mixture",
    items: [
      item("beaker", "Gelas beker", "tool", "beaker"),
      item("solution", "Larutan A", "material", "bottle"),
      item("reagent", "Larutan B", "material", "bottle"),
    ],
    steps: [
      {
        instruction: "Letakkan gelas beker di meja.",
        hint: "Pilih gelas beker dari daftar alat lalu letakkan di meja.",
        action: "place",
        item: "beaker",
      },
      {
        instruction: "Tuang Larutan A ke dalam gelas beker.",
        hint: "Seret Larutan A langsung ke gelas beker, atau pilih larutannya lalu jalankan aksi tuang.",
        action: "pour",
        item: "solution",
      },
      {
        instruction: "Tambahkan Larutan B dan amati perubahannya.",
        hint: "Seret Larutan B langsung ke gelas beker, atau pilih larutannya lalu jalankan aksi tambah.",
        action: "add",
        item: "reagent",
      },
      {
        instruction: "Kenali tanda terbentuknya zat baru.",
        hint: "Perhatikan padatan yang membuat larutan keruh.",
        action: "answer",
        question: q(
          "Apa nama padatan yang membuat larutan keruh?",
          ["Endapan", "Pelarut", "Indikator", "Gas"],
          0,
          "Padatan yang tidak larut dan terbentuk saat reaksi disebut endapan.",
        ),
      },
    ],
  },
  {
    id: "dilution",
    subject: "chemistry",
    title: "Pengenceran dan Konsentrasi",
    subtitle: "Buat larutan menjadi lebih encer",
    duration: 10,
    objective:
      "Amati perubahan konsentrasi saat air ditambahkan tanpa mengubah jumlah zat terlarut.",
    theory:
      "Pengenceran menyebarkan jumlah zat terlarut yang sama dalam volume yang lebih besar. C₁V₁ = C₂V₂.",
    equipment: ["Gelas ukur", "Gelas beker"],
    materials: ["Larutan pekat", "Air"],
    concept:
      "Jika volume total menjadi dua kali lipat, konsentrasi menjadi setengahnya.",
    visual: "dilution",
    items: [
      item("cylinder", "Gelas ukur", "tool", "cylinder"),
      item("concentrate", "Larutan pekat", "material", "bottle"),
      item("water", "Air", "material", "drop"),
    ],
    steps: [
      {
        instruction: "Letakkan gelas ukur di meja.",
        hint: "Pilih gelas ukur lalu letakkan di meja.",
        action: "place",
        item: "cylinder",
      },
      {
        instruction: "Tambahkan larutan pekat ke dalam gelas ukur.",
        hint: "Seret larutan pekat langsung ke gelas ukur, atau pilih larutannya lalu jalankan aksi tambah.",
        action: "add",
        item: "concentrate",
      },
      {
        instruction: "Tambahkan air hingga volume menjadi dua kali lipat.",
        hint: "Seret air langsung ke gelas ukur, atau pilih air lalu jalankan aksi tambah.",
        action: "add",
        item: "water",
      },
      {
        instruction: "Periksa konsentrasi setelah pengenceran.",
        hint: "Gunakan hubungan C₁V₁ = C₂V₂.",
        action: "answer",
        question: q(
          "Jika volume menjadi dua kali lipat, konsentrasinya menjadi berapa?",
          ["Dua kali lipat", "Setengahnya", "Tetap", "Nol"],
          1,
          "Jumlah zat terlarut tetap, tetapi volumenya menjadi dua kali lipat. Jadi, konsentrasinya menjadi setengahnya.",
        ),
      },
    ],
  },
  {
    id: "ohms-law",
    subject: "physics",
    title: "Rangkaian Hukum Ohm",
    subtitle: "Susun rangkaian dan amati arus listrik",
    duration: 15,
    objective:
      "Pelajari bagaimana tegangan dan hambatan menentukan kuat arus listrik.",
    theory:
      "Hukum Ohm menghubungkan tegangan, kuat arus, dan hambatan: I = V / R. Menaikkan tegangan memperbesar arus, sedangkan menaikkan hambatan memperkecilnya. Arus hanya mengalir jika rangkaian tertutup.",
    equipment: ["Baterai", "Resistor", "Kabel", "Lampu", "Amperemeter"],
    materials: [],
    concept:
      "Pada rangkaian tertutup, kuat arus sama dengan tegangan dibagi hambatan.",
    visual: "circuit",
    items: [
      item("battery", "Baterai", "tool", "battery"),
      item("resistor", "Resistor", "tool", "resistor"),
      item("wire", "Kabel", "tool", "wire"),
      item("lamp", "Lampu", "tool", "lamp"),
      item("ammeter", "Amperemeter", "tool", "meter"),
    ],
    steps: [
      {
        instruction: "Letakkan baterai sebagai sumber listrik rangkaian.",
        hint: "Seret baterai ke papan rangkaian.",
        action: "place",
        item: "battery",
      },
      {
        instruction: "Pasang resistor untuk mengatur kuat arus.",
        hint: "Letakkan resistor di papan rangkaian.",
        action: "place",
        item: "resistor",
      },
      {
        instruction: "Pasang lampu agar aliran arus terlihat.",
        hint: "Letakkan lampu di papan rangkaian.",
        action: "place",
        item: "lamp",
      },
      {
        instruction: "Hubungkan komponen dengan kabel.",
        hint: "Letakkan kabel untuk menutup rangkaian.",
        action: "place",
        item: "wire",
      },
      {
        instruction: "Atur tegangan dan hambatan, lalu hitung kuat arus.",
        hint: "Gunakan I = V / R. Coba geser pengatur tegangan dan hambatan.",
        action: "answer",
        question: q(
          "Pada tegangan 6 V dan hambatan 3 Ω, berapa kuat arusnya?",
          ["0.5 A", "2 A", "3 A", "18 A"],
          1,
          "Kuat arus sama dengan tegangan dibagi hambatan: 6 ÷ 3 = 2 A.",
        ),
      },
    ],
  },
  {
    id: "projectile",
    subject: "physics",
    title: "Gerak Parabola",
    subtitle: "Luncurkan, ukur, dan bandingkan",
    duration: 12,
    objective:
      "Amati pengaruh sudut peluncuran terhadap jarak jangkauan pada kecepatan awal yang tetap.",
    theory:
      "Tanpa hambatan udara, jarak jangkauan horizontal adalah R = v² sin(2θ) / g. Pada permukaan datar, jangkauan terbesar terjadi pada sudut sekitar 45°.",
    equipment: ["Pelontar", "Penanda jarak"],
    materials: ["Bola"],
    concept: "Sudut peluncuran 45° menghasilkan jangkauan ideal terbesar.",
    visual: "projectile",
    items: [
      item("launcher", "Pelontar", "tool", "launcher"),
      item("ball", "Bola", "material", "ball"),
    ],
    steps: [
      {
        instruction: "Letakkan pelontar di lapangan.",
        hint: "Pilih pelontar lalu letakkan di lapangan.",
        action: "place",
        item: "launcher",
      },
      {
        instruction: "Masukkan bola ke pelontar.",
        hint: "Pilih bola lalu letakkan di area percobaan.",
        action: "place",
        item: "ball",
      },
      {
        instruction: "Luncurkan bola dan amati lintasannya.",
        hint: "Pilih pelontar lalu jalankan aksi luncurkan.",
        action: "activate",
        item: "launcher",
      },
      {
        instruction: "Prediksi sudut dengan jangkauan terjauh.",
        hint: "Pikirkan keseimbangan antara kecepatan vertikal dan horizontal.",
        action: "answer",
        question: q(
          "Sudut ideal mana yang menghasilkan jangkauan terjauh pada permukaan datar?",
          ["15°", "30°", "45°", "90°"],
          2,
          "Pada sudut 45°, sin(2θ) mencapai nilai maksimum, yaitu 1.",
        ),
      },
    ],
  },
  {
    id: "pendulum",
    subject: "physics",
    title: "Bandul Sederhana",
    subtitle: "Temukan pola ayunan bandul",
    duration: 10,
    objective: "Amati pengaruh panjang bandul terhadap periode ayunannya.",
    theory:
      "Untuk ayunan kecil, periode T ≈ 2π√(L/g). Bandul yang lebih panjang berayun lebih lambat.",
    equipment: ["Statif", "Beban bandul"],
    materials: [],
    concept: "Bandul yang lebih panjang memiliki periode lebih lama.",
    visual: "pendulum",
    items: [
      item("stand", "Statif", "tool", "stand"),
      item("bob", "Beban bandul", "tool", "ball"),
    ],
    steps: [
      {
        instruction: "Siapkan statif untuk bandul.",
        hint: "Letakkan statif di meja.",
        action: "place",
        item: "stand",
      },
      {
        instruction: "Pasang beban bandul.",
        hint: "Pilih beban bandul lalu letakkan di area percobaan.",
        action: "place",
        item: "bob",
      },
      {
        instruction: "Lepaskan bandul agar mulai berayun.",
        hint: "Pilih beban bandul lalu jalankan aksi lepaskan.",
        action: "activate",
        item: "bob",
      },
      {
        instruction: "Bandingkan periode pada panjang bandul yang berbeda.",
        hint: "Coba geser pengatur panjang tali.",
        action: "answer",
        question: q(
          "Apa yang terjadi jika panjang bandul bertambah?",
          [
            "Periodenya bertambah",
            "Periodenya menjadi nol",
            "Massanya menghilang",
            "Periodenya tetap",
          ],
          0,
          "Periode bertambah sebanding dengan akar kuadrat panjang bandul.",
        ),
      },
    ],
  },
  {
    id: "microscope",
    subject: "biology",
    title: "Pengamatan Sel dengan Mikroskop",
    subtitle: "Siapkan preparat dan amati sel",
    duration: 14,
    objective:
      "Siapkan preparat dan kenali struktur sel tumbuhan yang terlihat.",
    theory:
      "Mikroskop memperbesar struktur yang kecil. Preparat basah menempatkan sampel tipis di bawah kaca penutup. Pada sel tumbuhan, kita dapat melihat dinding sel, sitoplasma, dan inti sel. Perbesaran yang lebih tinggi memperlihatkan lebih banyak detail, tetapi bidang pandangnya lebih sempit.",
    equipment: ["Mikroskop", "Kaca objek", "Pipet tetes"],
    materials: ["Sampel tumbuhan", "Air"],
    concept: "Inti sel membantu mengatur aktivitas sel.",
    visual: "cell",
    items: [
      item("microscope", "Mikroskop", "tool", "microscope"),
      item("slide", "Kaca objek", "tool", "slide"),
      item("sample", "Sampel tumbuhan", "material", "leaf"),
      item("water", "Tetes air", "material", "drop"),
    ],
    steps: [
      {
        instruction: "Letakkan kaca objek di baki preparat.",
        hint: "Pilih kaca objek lalu letakkan di area percobaan.",
        action: "place",
        item: "slide",
      },
      {
        instruction: "Tambahkan sampel tumbuhan yang tipis ke kaca objek.",
        hint: "Letakkan sampel tumbuhan di meja, lalu pilih dan tambahkan ke kaca objek.",
        action: "add",
        item: "sample",
      },
      {
        instruction: "Tambahkan setetes air untuk membuat preparat basah.",
        hint: "Letakkan tetes air di meja, lalu pilih dan tambahkan ke preparat.",
        action: "add",
        item: "water",
      },
      {
        instruction: "Letakkan mikroskop di samping kaca objek.",
        hint: "Pilih mikroskop lalu letakkan di meja.",
        action: "place",
        item: "microscope",
      },
      {
        instruction: "Masukkan preparat dan atur fokus mikroskop.",
        hint: "Pilih mikroskop lalu jalankan aksi amati.",
        action: "activate",
        item: "microscope",
      },
      {
        instruction: "Kenali struktur yang mengatur aktivitas sel.",
        hint: "Cari struktur bulat di dekat bagian tengah setiap sel.",
        action: "answer",
        question: q(
          "Struktur mana yang mengatur aktivitas di dalam sel?",
          ["Dinding sel", "Inti sel", "Vakuola", "Sitoplasma"],
          1,
          "Inti sel mengandung DNA dan membantu mengatur aktivitas sel.",
        ),
      },
    ],
  },
  {
    id: "transpiration",
    subject: "biology",
    title: "Transpirasi Tumbuhan",
    subtitle: "Lacak air yang keluar dari daun",
    duration: 11,
    objective: "Pahami bagaimana tumbuhan melepaskan uap air melalui stomata.",
    theory:
      "Air bergerak dari akar ke daun, lalu menguap melalui stomata. Daun yang dibungkus dapat menghasilkan tetesan air dari uap yang mengembun.",
    equipment: ["Tumbuhan", "Kantong bening"],
    materials: ["Air"],
    concept: "Transpirasi melepaskan uap air melalui daun.",
    visual: "plant",
    items: [
      item("plant", "Tumbuhan", "material", "leaf"),
      item("bag", "Kantong bening", "tool", "bag"),
      item("water", "Air", "material", "drop"),
    ],
    steps: [
      {
        instruction: "Letakkan tumbuhan di meja.",
        hint: "Pilih tumbuhan lalu letakkan di meja.",
        action: "place",
        item: "plant",
      },
      {
        instruction: "Siram tumbuhan dengan air.",
        hint: "Letakkan air di meja, lalu pilih dan jalankan aksi tambah.",
        action: "add",
        item: "water",
      },
      {
        instruction: "Bungkus daun dengan kantong bening.",
        hint: "Pilih kantong bening lalu letakkan di area percobaan.",
        action: "place",
        item: "bag",
      },
      {
        instruction: "Amati tetesan air di dalam kantong.",
        hint: "Tetesan tersebut berasal dari tumbuhan.",
        action: "answer",
        question: q(
          "Dari mana asal air di dalam kantong?",
          [
            "Daun melepaskan uap air",
            "Kantong menghasilkan air",
            "Sinar matahari berubah menjadi air",
            "Tanah berubah menjadi plastik",
          ],
          0,
          "Daun melepaskan uap air melalui stomata. Uap tersebut mengembun pada kantong.",
        ),
      },
    ],
  },
  {
    id: "blood-cells",
    subject: "biology",
    title: "Identifikasi Sel Darah",
    subtitle: "Kenali sel dari bentuknya",
    duration: 9,
    objective: "Bedakan sel darah merah, sel darah putih, dan trombosit.",
    theory:
      "Sel darah merah membawa oksigen, sel darah putih membantu pertahanan tubuh, dan trombosit membantu pembekuan darah.",
    equipment: ["Mikroskop", "Preparat apusan darah"],
    materials: [],
    concept: "Komponen darah memiliki fungsi yang berbeda-beda.",
    visual: "blood",
    items: [
      item("microscope", "Mikroskop", "tool", "microscope"),
      item("slide", "Preparat apusan darah", "tool", "slide"),
    ],
    steps: [
      {
        instruction: "Letakkan preparat apusan darah.",
        hint: "Pilih preparat apusan darah lalu letakkan di meja.",
        action: "place",
        item: "slide",
      },
      {
        instruction: "Letakkan mikroskop di meja.",
        hint: "Pilih mikroskop lalu letakkan di meja.",
        action: "place",
        item: "microscope",
      },
      {
        instruction: "Atur fokus untuk mengamati preparat.",
        hint: "Pilih mikroskop lalu jalankan aksi amati.",
        action: "activate",
        item: "microscope",
      },
      {
        instruction: "Kenali sel yang membawa oksigen.",
        hint: "Cari sel berbentuk cakram merah yang jumlahnya paling banyak.",
        action: "answer",
        question: q(
          "Sel mana yang membawa sebagian besar oksigen?",
          ["Trombosit", "Sel darah putih", "Sel darah merah", "Plasma"],
          2,
          "Sel darah merah mengandung hemoglobin yang membawa oksigen.",
        ),
      },
    ],
  },
];

export const getExperiment = (id: string) =>
  experiments.find((x) => x.id === id);
