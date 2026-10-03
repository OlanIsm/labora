import { Atom, Beaker, Leaf } from "lucide-react";
import type { Subject } from "./subjectTypes";

export const subjects = [
  {
    id: "chemistry" as Subject,
    name: "Kimia",
    description: "Larutan, warna, dan reaksi",
    question: "Kenapa larutan bisa berubah warna?",
    icon: Beaker,
    mascot: "/mascot/lion_chemistry.png",
  },
  {
    id: "physics" as Subject,
    name: "Fisika",
    description: "Gerak, energi, dan listrik",
    question: "Apa yang membuat lampu menyala?",
    icon: Atom,
    mascot: "/mascot/physics_elephant.png",
  },
  {
    id: "biology" as Subject,
    name: "Biologi",
    description: "Sel, tumbuhan, dan kehidupan",
    question: "Ada apa di balik sehelai daun?",
    icon: Leaf,
    mascot: "/mascot/biology_cat.png",
  },
];
