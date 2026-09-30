import { Experiment } from './data';
export type Answer = { choice: number; correct: boolean; attempts: number; prompt: string; explanation: string; expected: string };
export type Runtime = { step: number; placed: string[]; done: number[]; answers: Record<number, Answer>; feedback: string; voltage: number; resistance: number; angle: number; speed: number; length: number; zoom: number; launched: boolean; observed: boolean };
export const initialRuntime = (): Runtime => ({ step:0, placed:[], done:[], answers:{}, feedback:'Your bench is ready. Start with the highlighted item.', voltage:6, resistance:3, angle:45, speed:12, length:1, zoom:40, launched:false, observed:false });
export function act(exp: Experiment, state: Runtime, action: string, item: string): Runtime {
  const step = exp.steps[state.step];
  if (!step) return state;
  if (exp.subject === 'chemistry') {
    if (step.action !== action || step.item !== item) return { ...state, feedback:`Not yet. This step asks you to ${step.instruction.toLowerCase()}` };
    const placed = state.placed.includes(item) ? state.placed : [...state.placed,item];
    return { ...state, placed, step:state.step+1, done:[...state.done,state.step], feedback:action === 'place' ? `${exp.items.find(x=>x.id===item)?.name} placed. Well done.` : 'Good observation. The experiment has changed.' };
  }
  if (action === 'place' && !state.placed.includes(item)) state = { ...state, placed:[...state.placed,item] };
  if (action !== 'place' && !state.placed.includes(item)) return { ...state, feedback:'Place that item on the bench first, then use it.' };
  if (step.action === action && step.item === item) return { ...state, step:state.step+1, done:[...state.done,state.step], feedback:action === 'place' ? `${exp.items.find(x=>x.id===item)?.name} placed. Well done.` : action === 'activate' ? 'Observation complete. Look closely at the result.' : 'Good observation. The experiment has changed.', launched:state.launched || action === 'activate' && exp.visual === 'projectile', observed:state.observed || action === 'activate' && ['cell','blood'].includes(exp.visual) };
  if (action === 'place' && state.placed.includes(item)) return { ...state, feedback:`${exp.items.find(x=>x.id===item)?.name} is on the bench. Explore it, or use the highlighted item for this step.` };
  return { ...state, feedback:`That action is possible, but this step asks you to ${step.instruction.toLowerCase()}` };
}
export function answer(exp: Experiment, state: Runtime, choice: number): Runtime {
  const question = exp.steps[state.step]?.question;
  if (!question) return state;
  const previous = state.answers[state.step];
  const correct = choice === question.answer;
  return { ...state, step:state.step+1, done:[...state.done,state.step], answers:{...state.answers,[state.step]:{choice,correct,attempts:(previous?.attempts || 0)+1,prompt:question.prompt,explanation:question.explanation,expected:question.options[question.answer]}}, feedback:correct ? `Correct. ${question.explanation}` : `Good try. ${question.explanation}` };
}
export function score(exp: Experiment, state: Runtime) { const answered=Object.values(state.answers); const quiz=answered.length ? Math.round(answered.filter(a=>a.correct).length/answered.length*100) : 100; const accuracy=Math.round(state.done.length/exp.steps.length*100); return { quiz, accuracy, total:Math.round(quiz*.6+accuracy*.4) }; }
