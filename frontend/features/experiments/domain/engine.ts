import type { Experiment } from "./definitions";
export type Answer = {
  choice: number;
  correct: boolean;
  attempts: number;
  prompt: string;
  explanation: string;
  expected: string;
};
export type Runtime = {
  step: number;
  placed: string[];
  done: number[];
  answers: Record<number, Answer>;
  feedback: string;
  voltage: number;
  resistance: number;
  angle: number;
  speed: number;
  length: number;
  zoom: number;
  launched: boolean;
  observed: boolean;
};
export const initialRuntime = (): Runtime => ({
  step: 0,
  placed: [],
  done: [],
  answers: {},
  feedback: "Meja percobaan siap. Mulai dengan alat atau bahan yang disorot.",
  voltage: 6,
  resistance: 3,
  angle: 45,
  speed: 12,
  length: 1,
  zoom: 40,
  launched: false,
  observed: false,
});
function actionFeedback(exp: Experiment, step: number, item: string): string {
  const name = exp.items.find((x) => x.id === item)?.name || "Alat";
  const observations: Record<string, string> = {
    ph: "Warnanya berubah merah! Indikator menunjukkan larutan ini bersifat asam.",
    mixture:
      "Larutan menjadi keruh dan muncul endapan. Ada zat baru yang terbentuk!",
    dilution:
      "Air menambah volume larutan. Warnanya lebih muda karena konsentrasinya turun.",
    circuit:
      "Lampu menyala! Kabel menutup rangkaian sehingga arus bisa mengalir.",
    projectile:
      "Bola meluncur mengikuti lintasan melengkung. Coba ubah sudut dan bandingkan jangkauannya.",
    pendulum:
      "Bandul mulai berayun! Ubah panjang tali dan lihat waktu satu ayunannya.",
    cell: "Sel tumbuhan terlihat! Coba perbesar untuk mengamati dinding dan inti sel.",
    blood: "Sel darah terlihat! Coba perbesar dan bandingkan bentuk selnya.",
    plant:
      "Tetes air terlihat di kantong. Uap air dari daun mengembun menjadi air.",
  };
  const next = exp.steps[step + 1];
  const result = next?.question
    ? observations[exp.visual] || exp.concept
    : exp.steps[step].action === "place"
      ? `${name} sudah di meja. Siap dipakai!`
      : `${name} sudah ditambahkan. Amati perubahan pada meja percobaan.`;
  return `${result} ${next?.question ? "Sekarang, jawab pertanyaan dari pengamatanmu." : next ? `Berikutnya: ${next.instruction}` : "Semua langkah selesai."}`;
}
export function act(
  exp: Experiment,
  state: Runtime,
  action: string,
  item: string,
): Runtime {
  const step = exp.steps[state.step];
  if (!step) return state;
  if (exp.subject === "chemistry") {
    if (step.action !== action || step.item !== item)
      return {
        ...state,
        feedback: `Belum sesuai. Ikuti langkah ini: ${step.instruction}`,
      };
    const placed = state.placed.includes(item)
      ? state.placed
      : [...state.placed, item];
    return {
      ...state,
      placed,
      step: state.step + 1,
      done: [...state.done, state.step],
      feedback: actionFeedback(exp, state.step, item),
    };
  }
  if (action === "place" && !state.placed.includes(item))
    state = { ...state, placed: [...state.placed, item] };
  if (action !== "place" && !state.placed.includes(item))
    return {
      ...state,
      feedback:
        "Letakkan alat atau bahan itu di meja terlebih dahulu, lalu gunakan.",
    };
  if (step.action === action && step.item === item)
    return {
      ...state,
      step: state.step + 1,
      done: [...state.done, state.step],
      feedback: actionFeedback(exp, state.step, item),
      launched:
        state.launched ||
        (action === "activate" && exp.visual === "projectile"),
      observed:
        state.observed ||
        (action === "activate" && ["cell", "blood"].includes(exp.visual)),
    };
  if (action === "place" && state.placed.includes(item))
    return {
      ...state,
      feedback: `${exp.items.find((x) => x.id === item)?.name} sudah ada di meja. Coba gunakan, atau pilih alat atau bahan yang disorot untuk langkah ini.`,
    };
  return {
    ...state,
    feedback: `Aksi itu bisa dilakukan, tetapi ikuti langkah ini dahulu: ${step.instruction}`,
  };
}
export function answer(
  exp: Experiment,
  state: Runtime,
  choice: number,
): Runtime {
  const question = exp.steps[state.step]?.question;
  if (!question) return state;
  const previous = state.answers[state.step];
  const correct = choice === question.answer;
  return {
    ...state,
    step: state.step + 1,
    done: [...state.done, state.step],
    answers: {
      ...state.answers,
      [state.step]: {
        choice,
        correct,
        attempts: (previous?.attempts || 0) + 1,
        prompt: question.prompt,
        explanation: question.explanation,
        expected: question.options[question.answer],
      },
    },
    feedback: correct
      ? `Benar! ${question.explanation} Buka hasil untuk melihat catatan eksperimenmu.`
      : `Belum tepat, nggak apa-apa. ${question.explanation} Kamu bisa membaca hasilnya lalu mengulang eksperimen.`,
  };
}
export function score(exp: Experiment, state: Runtime) {
  const answered = Object.values(state.answers);
  const quiz = answered.length
    ? Math.round(
        (answered.filter((a) => a.correct).length / answered.length) * 100,
      )
    : 100;
  const accuracy = Math.round((state.done.length / exp.steps.length) * 100);
  return { quiz, accuracy, total: Math.round(quiz * 0.6 + accuracy * 0.4) };
}
