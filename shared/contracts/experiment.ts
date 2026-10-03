export type Subject = "chemistry" | "physics" | "biology";
export type Item = {
  id: string;
  name: string;
  kind: "tool" | "material";
  icon: string;
};
export type Question = {
  prompt: string;
  options: string[];
  answer?: number;
  explanation?: string;
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
