import { EquipmentGuide } from "../../lib/sandbox/equipmentGuides";

export const biologyGuides: Record<string, EquipmentGuide> = {
  aquarium: {
    purpose: "Akuarium digunakan untuk mengamati lingkungan perairan dan keseimbangan ekosistem.",
    usage: "Isi wadah, lalu buka Hasil pengamatan untuk melihat nilai model ekosistem.",
    limitation: "Nilai ekosistem adalah model pembelajaran relatif, bukan prediksi akuarium nyata.",
  },
  incubator: {
    purpose: "Wadah inkubasi menampung sampel yang diamati pada kondisi tertentu.",
    usage: "Di sini kamu bisa menambahkan bahan dan mengatur suhu virtual wadah.",
    limitation: "Belum ada pengendalian suhu otomatis seperti inkubator nyata.",
  },
};
