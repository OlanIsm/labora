import { specimens } from "./catalog";

const slideDetails = {
  blood: {
    category: "Jaringan hewan",
    color: "#e9a4b8",
    background: "#fff0f4",
    description:
      "Eritrosit tampak sebagai cakram dengan bagian tengah lebih pucat. Leukosit lebih besar dan memiliki inti berwarna ungu; trombosit terlihat sebagai fragmen kecil. Eritrosit manusia dewasa tidak memiliki inti.",
    observation: "Bandingkan ukuran eritrosit, leukosit, dan trombosit.",
    photo: {
      author: "Ajay Kumar Chaurasiya",
      source: "https://commons.wikimedia.org/w/index.php?curid=136997705",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      focal: [0.46, 0.42],
    },
  },
  onion: {
    category: "Sel tumbuhan",
    color: "#d8b980",
    background: "#fff8e8",
    description:
      "Sel epidermis bawang tersusun rapat seperti bata. Dinding sel membatasi tiap sel, sedangkan vakuola menempati sebagian besar ruang di dalamnya. Inti ditampilkan dengan pewarnaan. Epidermis umbi bawang umumnya tidak memiliki kloroplas.",
    observation:
      "Cari dinding sel yang membedakan satu sel dari sel di sebelahnya.",
    photo: {
      author: "loganrickert",
      source: "https://commons.wikimedia.org/w/index.php?curid=146585229",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0",
      focal: [0.225, 0.425],
    },
  },
  cheek: {
    category: "Sel hewan",
    color: "#b9a0d5",
    background: "#f5f0fc",
    description:
      "Sel epitel pipi berbentuk pipih dan tidak beraturan. Membran membatasi sitoplasma, dengan inti yang tampak lebih gelap setelah pewarnaan. Sel ini tidak memiliki dinding sel maupun kloroplas.",
    observation:
      "Bandingkan batas sel pipi dengan dinding sel pada preparat bawang.",
    photo: {
      author: "Kyreb",
      source: "https://commons.wikimedia.org/w/index.php?curid=178585141",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      focal: [0.5, 0.44],
    },
  },
  elodea: {
    category: "Sel tumbuhan",
    color: "#88b86d",
    background: "#f1fceb",
    description:
      "Sel daun Elodea memiliki dinding sel dan kloroplas hijau. Kloroplas berada di sitoplasma dekat tepi sel, mengelilingi vakuola besar di bagian tengah.",
    observation: "Temukan butiran kloroplas di sepanjang tepi sel.",
    photo: {
      author: "Daemon Canchig",
      source: "https://commons.wikimedia.org/w/index.php?curid=115731715",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      focal: [0.455, 0.456],
    },
  },
  stomata: {
    category: "Jaringan tumbuhan",
    color: "#79af85",
    background: "#edf8ef",
    description:
      "Dua sel penjaga mengapit celah stomata pada epidermis daun. Celah ini menjadi jalan pertukaran gas dan keluarnya uap air. Sel penjaga mengandung kloroplas.",
    observation: "Cari celah di antara sepasang sel penjaga.",
    photo: {
      author: "Trương Minh Khải",
      source: "https://commons.wikimedia.org/w/index.php?curid=174691995",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0",
      focal: [0.508, 0.252],
    },
  },
  paramecium: {
    category: "Organisme bersel satu",
    color: "#83b9cb",
    background: "#edf8fc",
    description:
      "Paramecium adalah organisme bersel satu. Silia di permukaannya membantu gerak dan pengambilan makanan. Di dalam sel terdapat inti serta vakuola, termasuk vakuola kontraktil untuk mengatur kelebihan air.",
    observation: "Perhatikan silia yang mengelilingi permukaan sel.",
    photo: {
      author: "Fritzmann2002",
      source: "https://commons.wikimedia.org/w/index.php?curid=64850765",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      focal: [0.39, 0.47],
    },
  },
  "yeast-slide": {
    category: "Jamur bersel satu",
    color: "#cfb378",
    background: "#fff9ec",
    description:
      "Sel ragi berbentuk bulat atau oval dan memiliki dinding sel. Beberapa sel memperlihatkan tunas kecil, salah satu cara ragi bereproduksi secara aseksual.",
    observation: "Cari tunas kecil yang masih melekat pada sel induk.",
    photo: {
      author: "Ajay Kumar Chaurasiya",
      source: "https://commons.wikimedia.org/w/index.php?curid=138212853",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      focal: [0.51, 0.45],
    },
  },
};

export type SlideId = keyof typeof slideDetails;
export const microscopeSlides = (Object.keys(slideDetails) as SlideId[]).map(
  (id) => ({ id, ...specimens[id], ...slideDetails[id] }),
);
export type MicroscopeSlide = (typeof microscopeSlides)[number];
export const OBJECTIVES = [4, 10, 40, 100] as const;
export type Objective = (typeof OBJECTIVES)[number];
export const INITIAL_MICROSCOPE = {
  slideId: null as SlideId | null,
  objective: 4 as Objective,
  focus: 0,
  light: 80,
};

export function insertSlide(id: string): typeof INITIAL_MICROSCOPE {
  return microscopeSlides.some((slide) => slide.id === id)
    ? { ...INITIAL_MICROSCOPE, slideId: id as SlideId }
    : { ...INITIAL_MICROSCOPE };
}

export function microscopeFieldWidth(objective: Objective): number {
  // A single photograph cannot supply the extra optical detail of a multi-objective scan.
  const cropWidths: Record<Objective, number> = {
    4: 1600,
    10: 1120,
    40: 640,
    100: 320,
  };
  return cropWidths[objective];
}

export function microscopePhotoViewBox(
  slide: MicroscopeSlide,
  objective: Objective,
): string {
  const width = microscopeFieldWidth(objective);
  const [x, y] = slide.photo.focal.map((position) =>
    Math.max(0, Math.min(1600 - width, position * 1600 - width / 2)),
  );
  return `${x} ${y} ${width} ${width}`;
}
