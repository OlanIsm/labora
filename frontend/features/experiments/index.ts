export { experiments, getExperiment } from "./domain/definitions";
export { act, answer, initialRuntime, score } from "./domain/engine";
export {
  classifyPH,
  dilution,
  ohmsLaw,
  pendulumPeriod,
  projectileRange,
} from "./domain/science";
export { runtimeRepository } from "./repository";
export type { RuntimeRepository } from "./repository";
