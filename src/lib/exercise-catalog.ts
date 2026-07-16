import {
  translateExerciseName,
  translateExerciseTerm,
} from "@/lib/exercise-catalog-vi";

const EXERCISE_DATASET_URL =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";

type RawExercise = {
  id?: unknown;
  name?: unknown;
  body_part?: unknown;
  category?: unknown;
  equipment?: unknown;
  target?: unknown;
  muscle_group?: unknown;
  secondary_muscles?: unknown;
  instructions?: unknown;
};

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  nameVi: string;
  bodyPart: string;
  bodyPartVi: string;
  equipment: string;
  equipmentVi: string;
  target: string;
  targetVi: string;
  muscleGroup: string;
  muscleGroupVi: string;
  secondaryMuscles: string[];
  instruction: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function instruction(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  return text((value as Record<string, unknown>).en);
}

function toCatalogItem(value: unknown): ExerciseCatalogItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const exercise = value as RawExercise;
  const id = text(exercise.id);
  const name = text(exercise.name);
  const bodyPart = text(exercise.body_part) || text(exercise.category);
  const equipment = text(exercise.equipment);
  const target = text(exercise.target);
  const muscleGroup = text(exercise.muscle_group);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    nameVi: translateExerciseName(name),
    bodyPart,
    bodyPartVi: translateExerciseTerm(bodyPart),
    equipment,
    equipmentVi: translateExerciseTerm(equipment),
    target,
    targetVi: translateExerciseTerm(target),
    muscleGroup,
    muscleGroupVi: translateExerciseTerm(muscleGroup),
    secondaryMuscles: Array.isArray(exercise.secondary_muscles)
      ? exercise.secondary_muscles.map(text).filter(Boolean)
      : [],
    instruction: instruction(exercise.instructions),
  };
}

export async function getExerciseCatalog() {
  const response = await fetch(EXERCISE_DATASET_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`Exercise dataset returned ${response.status}.`);
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("Exercise dataset has an invalid format.");
  }

  return payload
    .map(toCatalogItem)
    .filter((item): item is ExerciseCatalogItem => item !== null)
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function normalizeExerciseSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .trim();
}
