export type Assignment = {
  id: string;
  experimentId: string;
  title: string;
  instructions: string;
  className: string;
  stages: {
    instruction: string;
    hint: string;
    question: string;
    options: string[];
    answer: number;
  }[];
  createdAt: string;
};
