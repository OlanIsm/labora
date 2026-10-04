import { materials } from "./catalog";
import type { HistoryAction } from "./engine";
import { isLitmus, litmusExplanation } from "./litmus";
import type { Entity, LabEvent, LabState } from "./types";

export type Feedback = {
  title: string;
  detail: string;
  hint: string;
  target?: string;
  next?: "rack" | "observe" | "run";
};
const number = (value: number) =>
  value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
export function latestObservationSince(
  state: LabState,
  afterId: number | null,
): LabEvent | undefined {
  if (afterId === null) return undefined;
  return state.events
    .filter(
      (event) =>
        event.id > afterId &&
        [
          "gas.formed",
          "precipitate.formed",
          "indicator.changed",
          "container.overflow",
          "fuse.blown",
          "lamp.broken",
        ].includes(event.type),
    )
    .at(-1);
}
export const instrumentReadings: Record<string, string[]> = {
  "ph-meter": ["pH"],
  thermometer: ["Suhu (°C)"],
  balance: ["Massa isi (g)"],
  ammeter: ["Arus (A)"],
  voltmeter: ["Tegangan (V)"],
  multimeter: ["Arus (A)", "Tegangan (V)", "Hambatan efektif (Ω)"],
  "electrolyte-tester": ["Daya hantar relatif"],
  stopwatch: ["Waktu (s)"],
};
export function measurementFeedback(entity: Entity): string {
  if (!entity.connections.length && entity.material !== "stopwatch") return "";
  const values = entity.measurements;
  if (entity.material === "ph-meter" && values.pH !== undefined) {
    const type =
      Math.abs(values.pH - 7) < 0.01
        ? "netral"
        : values.pH < 7
          ? "asam"
          : "basa";
    return `pH terbaca ${number(values.pH)}. Larutan ini bersifat ${type}.`;
  }
  const key = instrumentReadings[entity.material]?.[0];
  return key && values[key] !== undefined
    ? `${key}: ${number(values[key])}.`
    : "";
}
export function selectionFeedback(entity: Entity): Feedback {
  const paperResult = litmusExplanation(entity);
  return {
    title: `${entity.label} dipilih.`,
    detail: paperResult
      ? `${paperResult.summary} ${paperResult.reason}`
      : measurementFeedback(entity) ||
        entity.status ||
        "Benda belum diubah. Tindakan yang tersedia ada di panel benda.",
    hint:
      paperResult?.hint ||
      "Kamu bisa memilih tindakan atau mengambil benda lain.",
    target: entity.id,
  };
}
export function failedDropFeedback(
  kind: "litmus" | "pour" | "rack" | "outside",
): Feedback {
  const explanations = {
    litmus: [
      "Kertas belum dicelupkan.",
      "Tujuan harus berupa wadah terbuka berisi cairan.",
      "Isi wadah dan buka penutupnya, lalu lepaskan kertas di atas cairan.",
    ],
    pour: [
      "Bahan belum dituang.",
      "Sumber harus berisi bahan yang bisa dituang dan kedua benda harus terbuka serta berbeda.",
      "Periksa isi sumber dan penutup wadah, lalu coba lagi.",
    ],
    rack: [
      "Tabung belum masuk ke rak.",
      "Slot hanya menerima tabung reaksi dan harus kosong.",
      "Pilih tabung reaksi, lalu gunakan slot kosong.",
    ],
    outside: [
      "Peletakan dibatalkan.",
      "Benda dilepas di luar tujuan yang tersedia. Meja tidak diubah.",
      "Lepaskan benda di meja, wadah terbuka, atau slot rak yang sesuai.",
    ],
  };
  const [title, detail, hint] = explanations[kind];
  return { title, detail, hint };
}
const result = (
  title: string,
  detail: string,
  hint: string,
  target?: string,
  next?: Feedback["next"],
): Feedback => ({ title, detail, hint, target, next });

export function actionFeedback(
  action: HistoryAction,
  before: LabState,
  after: LabState,
  playing = false,
): Feedback {
  const id = "id" in action ? action.id : undefined;
  const entity = after.entities.find((e) => e.id === id);
  const previous = before.entities.find((e) => e.id === id);
  if (action.type === "add") {
    const added = after.entities.find(
      (e) => !before.entities.some((old) => old.id === e.id),
    );
    if (!added)
      return result(
        "Alat belum diambil",
        "Benda belum tersedia di rak ini.",
        "Pilih alat atau bahan yang ada di rak.",
        undefined,
        "rack",
      );
    const material = materials[added.material];
    if (isLitmus(added.material))
      return result(
        `${added.label} sudah di meja.`,
        "Kertas belum diuji. Warna yang terlihat adalah warna awal strip.",
        "Seret dan lepaskan kertas di atas cairan untuk mencelupkan dan melihat hasilnya.",
        added.id,
      );
    return result(
      `${added.label} sudah di meja.`,
      material.kind === "container"
        ? "Wadahnya masih kosong. Belum ada bahan di dalamnya."
        : material.kind === "material"
          ? "Bahan masih berada di botol asal, belum masuk ke wadah lain."
          : "Alat sudah dipilih. Pengaturannya ada di panel benda.",
      material.kind === "container"
        ? "Kamu bisa mengambil bahan dari rak."
        : material.kind === "material"
          ? "Pilih “Tuang ke” dan jumlah bahan, lalu tekan “Tuang / campur”."
          : material.kind === "instrument"
            ? "Pilih benda yang diukur, lalu tekan “Sambungkan”."
            : added.material === "microscope"
              ? "Ambil preparat, lalu sambungkan ke mikroskop."
              : "Kamu bisa mengubah pengaturan alat ini.",
      added.id,
      material.kind === "container" || added.material === "microscope"
        ? "rack"
        : undefined,
    );
  }
  if (action.type === "pour") {
    const source = before.entities.find((e) => e.id === action.source),
      oldTarget = before.entities.find((e) => e.id === action.target),
      target = after.entities.find((e) => e.id === action.target);
    if (!source || !target || source.id === target.id)
      return result(
        "Belum ada bahan yang dituang.",
        "Pilih benda sumber dan tujuan yang berbeda.",
        "Pilih wadah lain sebagai tujuan.",
      );
    if (before.discipline === "chemistry" && (source.sealed || target.sealed))
      return result(
        "Belum ada bahan yang dituang.",
        "Wadah sumber atau tujuan masih tertutup.",
        "Pilih wadah yang tertutup, lalu tekan Buka wadah.",
      );
    const moved =
      source.contents.reduce((sum, p) => sum + p.mass, 0) -
      (after.entities
        .find((e) => e.id === source.id)
        ?.contents.reduce((sum, p) => sum + p.mass, 0) || 0);
    if (moved <= 1e-8)
      return result(
        "Belum ada bahan yang berpindah.",
        "Sumber kosong atau jumlah yang dipilih nol.",
        "Isi sumber atau pilih jumlah lebih dari nol.",
        source.id,
      );
    const observations: string[] = [];
    if (target.status === "Meluber")
      observations.push("Wadah terlalu penuh. Sebagian cairan meluber.");
    if (target.precipitate && target.precipitate !== oldTarget?.precipitate)
      observations.push("Endapan terlihat di dasar wadah.");
    if (target.gas > (oldTarget?.gas || 0) + 1e-10)
      observations.push("Gelembung gas terbentuk.");
    if (target.color !== oldTarget?.color)
      observations.push("Warna isi wadah berubah.");
    if (target.status === "Dua lapisan")
      observations.push("Minyak dan air membentuk dua lapisan.");
    const spilled = after.events.some(
      (e) =>
        e.id >= before.nextId &&
        e.entity === target.id &&
        e.type === "material.spilled",
    );
    return result(
      `${source.label} ditambahkan ke ${target.label}.`,
      spilled
        ? "Bahan berada di permukaan alat, bukan di wadah penampung."
        : observations.length
          ? observations.slice(0, 2).join(" ")
          : "Bahan berpindah. Belum tampak perubahan warna, endapan, atau gas.",
      spilled
        ? "Kamu bisa memakai gelas kimia sebagai penampung."
        : "Kamu bisa memilih wadah ini dan membaca alat ukur yang tersambung.",
      target.id,
      spilled ? "rack" : "observe",
    );
  }
  if (action.type === "connect") {
    const source = after.entities.find((e) => e.id === action.source),
      target = after.entities.find((e) => e.id === action.target);
    if (!source || !target || source.id === target.id)
      return result(
        "Belum tersambung.",
        "Pilih dua benda yang berbeda.",
        "Pilih benda tujuan dari daftar.",
      );
    const connected = source.connections.includes(target.id);
    const paper = isLitmus(source.material)
      ? source
      : isLitmus(target.material)
        ? target
        : undefined;
    const paperResult = paper && litmusExplanation(paper);
    if (paper)
      return result(
        connected ? "Kertas lakmus diuji." : "Kertas lakmus diangkat.",
        paperResult
          ? `${paperResult.summary} ${paperResult.reason}`
          : `${paper.status || "Warna kertas tetap."} Warna dan isi larutan tidak diubah oleh kertas.`,
        paperResult?.hint ||
          "Lakmus menunjukkan sifat asam/basa, bukan angka pH yang tepat.",
        paper.id,
      );
    const reading = measurementFeedback(source) || measurementFeedback(target);
    return result(
      connected
        ? `${source.label} tersambung ke ${target.label}.`
        : "Sambungan dilepas.",
      connected
        ? reading || "Garis di meja menunjukkan kedua benda yang tersambung."
        : "Kedua benda tidak lagi dihubungkan.",
      connected
        ? "Kamu bisa melihat hasil pengukuran di Pengamatan."
        : "Kamu bisa menghubungkan benda lain.",
      source.id,
      connected ? "observe" : undefined,
    );
  }
  if (action.type === "set" && entity) {
    const names: Record<string, string> = {
      temperature: "Suhu",
      targetTemperature: "Suhu target",
      amount: "Jumlah bahan",
      length: "Panjang",
      mass: "Massa",
      angle: "Sudut",
      focus: "Fokus",
      magnification: "Perbesaran",
      resistance: "Hambatan",
      voltage: "Tegangan",
      light: "Cahaya",
      concentration: "Konsentrasi",
    };
    const value =
      action.key === "temperature"
        ? entity.temperature
        : entity.params[action.key];
    const old =
      action.key === "temperature"
        ? previous?.temperature
        : previous?.params[action.key];
    const changed = Object.entries(entity.measurements).find(
      ([key, val]) =>
        key !== "Suhu (°C)" &&
        Number.isFinite(val) &&
        previous?.measurements[key] !== undefined &&
        Math.abs(val - previous.measurements[key]) > 0.00001 &&
        materials[entity.material].kind !== "container",
    );
    return result(
      `${names[action.key] || "Pengaturan"} ${entity.label} diubah.`,
      `${old !== undefined ? `${number(old)} menjadi ` : ""}${number(value)}.${changed ? ` ${changed[0]} sekarang ${number(changed[1])}.` : ""}`,
      action.key === "amount"
        ? "Ini baru jumlah yang dipilih. Bahannya belum dituang."
        : action.key === "focus"
          ? "Lihat apakah gambar sel menjadi lebih tajam."
          : "Kamu bisa membandingkan hasilnya di Pengamatan.",
      entity.id,
      action.key === "amount" ? undefined : "observe",
    );
  }
  if (action.type === "toggle" && entity)
    return result(
      action.key === "sealed"
        ? entity.sealed
          ? "Wadah ditutup."
          : "Wadah dibuka."
        : entity.active
          ? "Alat dinyalakan."
          : "Alat dihentikan.",
      action.key === "sealed"
        ? "Kondisi wadah berubah. Bahan di dalamnya tidak ditambah atau dibuang."
        : entity.active
          ? "Alat siap bekerja."
          : "Alat tidak lagi dijalankan.",
      action.key === "active" && entity.active && !playing
        ? "Waktu masih dijeda. Tekan “Jalankan” untuk melihat perubahan."
        : "Kamu bisa mengamati kondisi benda ini.",
      entity.id,
      action.key === "active" && entity.active && !playing ? "run" : undefined,
    );
  if (action.type === "operate" && entity) {
    if (action.operation === "launch")
      return result(
        `${entity.label} siap bergerak.`,
        "Waktu gerakan alat dimulai lagi dari nol.",
        playing
          ? "Amati posisi benda dan hasil pengukurannya."
          : "Waktu masih dijeda. Tekan “Jalankan” agar benda bergerak.",
        entity.id,
        playing ? "observe" : "run",
      );
    if (action.operation === "measure") {
      const text = measurementFeedback(entity);
      return result(
        text ? "Hasil ukur tersedia." : "Belum ada pembacaan alat.",
        text || "Alat belum memiliki hasil untuk benda yang diukur.",
        text
          ? "Kamu bisa mencatat nilainya atau mengubah kondisi percobaan."
          : "Pilih benda yang diukur, lalu sambungkan alat ini.",
        entity.id,
        text ? "observe" : undefined,
      );
    }
    const events = after.events.filter(
      (e) => e.id >= before.nextId && e.entity === entity.id,
    );
    const text = events.find((e) =>
      [
        "mixture.separated",
        "solvent.evaporated",
        "observation.unchanged",
        "observation.changed",
        "mixture.stirred",
      ].includes(e.type),
    )?.message;
    const names = {
      stir: "Campuran diaduk.",
      filter: "Penyaringan dicoba.",
      decant: "Dekantasi dicoba.",
      evaporate: "Penguapan dicoba.",
      distill: "Distilasi dicoba.",
      magnet: "Pemisahan dengan magnet dicoba.",
    };
    return result(
      names[action.operation],
      text ||
        (action.operation === "stir"
          ? "Isi wadah diaduk."
          : "Belum ada perubahan baru yang teramati."),
      text?.includes("penerima")
        ? "Sambungkan wadah kosong sebagai penerima."
        : text?.includes("suhu")
          ? "Penguapan membutuhkan pelarut dan suhu yang cukup."
          : "Kamu bisa membandingkan isi wadah sebelum dan sesudah tindakan.",
      entity.id,
      "observe",
    );
  }
  if (action.type === "move")
    return result(
      `${entity?.label || previous?.label || "Benda"} dipindahkan.`,
      "Benda berpindah di meja. Isinya tetap sama.",
      "Memindahkan benda saja tidak menuang atau menyambungkan bahan.",
      id,
    );
  if (action.type === "remove")
    return result(
      `${previous?.label || "Benda"} dikembalikan ke rak.`,
      "Benda dan sambungannya dihapus dari meja.",
      "Tekan “Batalkan” jika ingin mengembalikannya.",
    );
  if (action.type === "label")
    return result(
      "Nama benda diubah.",
      `Label sekarang: ${entity?.label || ""}.`,
      "Nama baru tidak mengubah bahan di dalamnya.",
      id,
    );
  if (action.type === "note")
    return result(
      "Catatan disimpan.",
      "Pengamatan dan snapshot alat ukur ditambahkan ke Buku Catatan Lab.",
      "Kamu bisa membuka buku catatan untuk membaca atau mengekspornya.",
    );
  if (action.type === "undo" || action.type === "redo")
    return result(
      action.type === "undo" ? "Tindakan dibatalkan." : "Tindakan diulangi.",
      "Meja kembali ke konfigurasi yang tersimpan dalam riwayat.",
      "Waktu dijeda agar kamu bisa memeriksa perubahan.",
    );
  if (action.type === "reset")
    return result(
      "Meja dikosongkan.",
      "Benda, catatan dan waktu pada meja ini direset.",
      "Kamu bisa mengambil alat baru, atau menekan “Batalkan”.",
      undefined,
      "rack",
    );
  if (action.type === "load")
    return result(
      "Meja dimuat.",
      "Konfigurasi lokal ditampilkan. Waktu simulasi dijeda.",
      "Pilih benda di meja untuk melanjutkan percobaan.",
    );
  return result(
    "Kondisi meja diperbarui.",
    "Perubahan tersedia di meja dan Pengamatan.",
    "Urutan percobaan tetap bebas.",
  );
}

export function observationFeedback(
  event: LabEvent,
  state: LabState,
): Feedback {
  const entity = state.entities.find((e) => e.id === event.entity);
  return result(
    entity ? `Perubahan pada ${entity.label}.` : "Perubahan teramati.",
    event.message,
    "Kamu bisa melihat hasilnya atau mencatat pengamatan.",
    entity?.id,
    "observe",
  );
}
