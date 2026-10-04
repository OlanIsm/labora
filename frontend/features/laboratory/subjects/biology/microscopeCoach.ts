import { INITIAL_MICROSCOPE, microscopeSlides } from "./microscope";
import type { MicroscopeSlide, Objective, SlideId } from "./microscope";

const observations: Record<SlideId, Record<Objective, string>> = {
  blood: {
    4: "Ini apusan darah dengan pewarnaan Wright. Sel merah muda yang paling banyak adalah eritrosit, pengangkut oksigen. Sel besar berwarna ungu di dekat tengah adalah leukosit. Mulai dengan membandingkan ukuran keduanya.",
    10: "Bidang pandangnya sekarang lebih sempit. Leukosit berinti ungu tampak lebih besar daripada eritrosit di sekitarnya. Bagian tengah eritrosit yang pucat bukan inti: eritrosit manusia dewasa tidak memiliki inti.",
    40: "Kita menyorot leukosit jenis neutrofil. Gumpalan ungu tua yang saling terhubung adalah lobus intinya, bukan beberapa sel terpisah. Neutrofil membantu pertahanan tubuh terhadap infeksi.",
    100: "Sekarang kamu melihat potongan kecil bagian leukosit. Zoom digital memperbesar piksel, bukan menambah struktur baru. Untuk melihat bentuk inti berlobus secara utuh, kembalilah ke 40×.",
  },
  onion: {
    4: "Garis-garis panjang pada foto membatasi sel epidermis bawang. Itulah dinding sel, yang menopang bentuk sel tumbuhan. Warna kebiruan berasal dari preparasi dan pewarnaan, bukan berarti bawangnya berwarna biru.",
    10: "Batas sel sudah lebih besar. Bentuk oval gelap di dekat dinding sel adalah inti yang terwarnai. Ruang luas yang lebih terang di dalam sel terutama ditempati vakuola; membrannya tidak selalu terlihat jelas pada foto.",
    40: "Kita menyorot inti yang menempel dekat tepi sel. Vakuola besar dapat mendorong sitoplasma dan inti ke tepi. Bandingkan oval gelap ini dengan garis dinding sel yang memanjang di sebelahnya.",
    100: "Ini pembesaran digital area inti, jadi gambarnya bisa lebih lunak. Foto ini tidak memperlihatkan kromosom atau DNA satu per satu. Turunkan zoom untuk melihat kembali hubungan inti, dinding sel, dan ruang sel.",
  },
  cheek: {
    4: "Ini sel epitel dari bagian dalam pipi. Bentuknya pipih dan tidak seteratur sel bawang. Batas kebiruan mengelilingi sel; lingkaran lebih gelap di dalamnya adalah inti. Jarum hitam pada foto adalah penunjuk mikroskop, bukan bagian sel.",
    10: "Inti berwarna lebih gelap sekarang berada di dekat tengah pandangan. Daerah yang lebih pucat di sekitarnya adalah sitoplasma. Sel pipi tidak memiliki dinding sel kaku, sehingga bentuknya lebih tidak beraturan daripada sel bawang.",
    40: "Kita menyorot inti sel pipi. Pewarnaan membantu membedakannya dari sitoplasma, tetapi tidak membuat organel kecil lain otomatis terlihat. Coba ingat: eritrosit dewasa pada preparat darah justru tidak memiliki inti.",
    100: "Zoom ini hanya memperbesar bagian inti pada foto. Tampilan kabur bukan tanda inti memiliki bentuk baru. Kembali ke zoom lebih rendah, lalu bandingkan batas sel pipi dengan dinding sel pada bawang.",
  },
  elodea: {
    4: "Ini daun Elodea. Garis batas sel membentuk susunan sel tumbuhan, dan butiran hijau di dalamnya adalah kloroplas. Kloroplas mengandung klorofil yang membantu menangkap energi cahaya untuk fotosintesis.",
    10: "Butiran kloroplas tampak lebih besar. Banyak berada di sitoplasma dekat tepi sel, karena vakuola menempati sebagian besar bagian tengah. Penunjuk hitam yang mungkin terlihat berasal dari mikroskop, bukan jaringan daun.",
    40: "Kita memperbesar daerah yang berisi kloroplas. Butiran-butiran hijau adalah organel di dalam sel, bukan sel-sel baru. Foto ini diam, jadi kita tidak sedang mengamati gerak sitoplasma secara langsung.",
    100: "Zoom digital tidak memperlihatkan tilakoid atau struktur dalam kloroplas pada foto ini. Turunkan zoom untuk mengenali kembali butiran hijau dan batas sel. Lalu bandingkan dengan epidermis umbi bawang yang umumnya tidak berkloroplas.",
  },
  stomata: {
    4: "Ini epidermis daun Tradescantia. Di antara sel-sel epidermis, cari bentuk oval hijau seperti sepasang bibir. Itulah sepasang sel penjaga yang mengapit celah stomata, tempat pertukaran gas dan keluarnya uap air.",
    10: "Pasangan sel penjaga di bagian atas foto sekarang menjadi pusat pandangan. Celah di antara keduanya adalah pori stomata. Butiran hijau di dalam sel penjaga adalah kloroplas, berbeda dari celah yang kosong di tengah.",
    40: "Sekarang kita menyorot celah stomata dan tepi kedua sel penjaga. Jangan menghitung sepasang sel penjaga sebagai satu sel. Bukaan stomata dapat berubah pada daun hidup, tetapi foto ini hanya merekam satu keadaan.",
    100: "Yang membesar adalah potongan celah pada foto, bukan proses stomata membuka dan menutup. Kembali ke zoom lebih rendah untuk melihat pasangan sel penjaga secara utuh dan bandingkan dengan sel daun Elodea.",
  },
  paramecium: {
    4: "Bentuk memanjang seperti sandal pada foto adalah Paramecium, organisme bersel satu. Satu tubuh ini menjalankan fungsi hidup dalam satu sel. Berbeda dengan preparat pipi, kita sedang melihat satu organisme, bukan bagian jaringan tubuh.",
    10: "Kita menyorot Paramecium yang lebih kecil di bawah. Batas tubuh sel terlihat, dan bagian dalamnya tampak bergranula. Tidak semua granula bisa dikenali sebagai organel tertentu hanya dari foto ini.",
    40: "Permukaan tubuhnya sekarang lebih besar. Paramecium memiliki silia untuk bergerak dan mengambil makanan, tetapi silia individual tidak terpisah jelas pada foto ini. Foto diam juga tidak bisa menunjukkan arah geraknya.",
    100: "Pembesaran ini melampaui detail yang bisa dijelaskan oleh foto. Kita tidak bisa mengidentifikasi inti atau vakuola dari setiap bercak gelap. Turunkan zoom dan bandingkan bentuk tubuhnya dengan sel ragi.",
  },
  "yeast-slide": {
    4: "Bintik bulat dan oval yang banyak ini adalah sel ragi, jamur bersel satu. Sel-selnya tidak tersusun sebagai jaringan seperti epidermis bawang. Mulai dengan melihat bentuk dan pengelompokannya.",
    10: "Sekarang batas tiap sel ragi lebih mudah dibedakan. Ada sel tunggal dan kelompok sel yang berdekatan. Jangan langsung menyebut setiap dua sel yang bersentuhan sebagai sel induk dan tunas.",
    40: "Cari tonjolan kecil yang masih melekat pada sel lebih besar: itu dapat menunjukkan pertunasan. Tunas adalah calon sel anak. Tidak semua sel pada bidang ini sedang bertunas, dan foto tunggal tidak menunjukkan prosesnya berlangsung.",
    100: "Zoom memperbesar batas sel, tetapi tidak menambah resolusi foto. Detail yang makin lunak tidak bisa dipakai untuk menyimpulkan organel baru. Kembali ke 40× untuk mencari bentuk sel dan kemungkinan tunas dengan lebih utuh.",
  },
};

const comparisons: Record<SlideId, SlideId> = {
  blood: "cheek",
  onion: "cheek",
  cheek: "onion",
  elodea: "onion",
  stomata: "elodea",
  paramecium: "yeast-slide",
  "yeast-slide": "paramecium",
};
export type MicroscopeGuide = {
  line: string;
  actionLabel: string;
  objective?: Objective;
  slideId?: SlideId;
  adjustment?: "focus" | "light";
};

export function microscopeGuide(
  view: typeof INITIAL_MICROSCOPE,
  slide?: MicroscopeSlide,
): MicroscopeGuide {
  if (!slide)
    return {
      line: "Hai, aku Ellie! Kita akan belajar mengenali sel dari foto mikroskop asli. Masukkan satu preparat, mulai dari objektif 4× untuk melihat keseluruhannya, lalu perbesar sedikit demi sedikit. Kamu bisa menyeret preparat atau mengekliknya.",
      actionLabel: "Mulai dengan preparat darah",
      slideId: "blood",
    };
  if (Math.abs(view.focus) >= 4)
    return {
      line: `Batas struktur ${slide.name.toLowerCase()} sedang kabur karena pengaturan fokus bergeser. Tajamkan dulu sebelum menafsirkan bercak atau bentuk sel. Pada simulator ini, posisi fokus 0 adalah posisi paling tajam; ketajaman tetap dibatasi foto aslinya.`,
      actionLabel: "Tajamkan fokus",
      adjustment: "focus",
    };
  if (view.light < 35)
    return {
      line: "Bidang pandangnya terlalu gelap untuk membedakan batas sel dengan nyaman. Tambahkan cahaya dulu, lalu lihat lagi. Mengubah pencahayaan tidak mengubah jenis atau isi sel pada preparat.",
      actionLabel: "Terangkan preparat",
      adjustment: "light",
    };
  const line = observations[slide.id][view.objective];
  const next: Record<Objective, Objective> = { 4: 10, 10: 40, 40: 100, 100: 4 };
  if (view.objective !== 100)
    return {
      line,
      actionLabel: `Perbesar ke objektif ${next[view.objective]}×`,
      objective: next[view.objective],
    };
  const compareId = comparisons[slide.id];
  const compare = microscopeSlides.find((s) => s.id === compareId)!;
  return {
    line,
    actionLabel: `Bandingkan dengan ${compare.name.toLowerCase()}`,
    slideId: compareId,
  };
}
