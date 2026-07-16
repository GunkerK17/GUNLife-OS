import { NextResponse } from "next/server";
import {
  getExerciseCatalog,
  normalizeExerciseSearch,
} from "@/lib/exercise-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 86_400;

function boundedLimit(value: string | null) {
  const parsed = Number(value ?? 18);

  if (!Number.isFinite(parsed)) {
    return 18;
  }

  return Math.min(40, Math.max(1, Math.round(parsed)));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = normalizeExerciseSearch(url.searchParams.get("q") ?? "");
    const bodyPart = normalizeExerciseSearch(
      url.searchParams.get("bodyPart") ?? "",
    );
    const equipment = normalizeExerciseSearch(
      url.searchParams.get("equipment") ?? "",
    );
    const limit = boundedLimit(url.searchParams.get("limit"));
    const catalog = await getExerciseCatalog();
    const bodyParts = Array.from(
      new Map(
        catalog
          .filter((item) => item.bodyPart)
          .map((item) => [item.bodyPart, item.bodyPartVi]),
      ),
      ([value, labelVi]) => ({ value, labelVi }),
    ).sort((first, second) => first.value.localeCompare(second.value));
    const equipments = Array.from(
      new Map(
        catalog
          .filter((item) => item.equipment)
          .map((item) => [item.equipment, item.equipmentVi]),
      ),
      ([value, labelVi]) => ({ value, labelVi }),
    ).sort((first, second) => first.value.localeCompare(second.value));
    const matches = catalog.filter((item) => {
      if (
        bodyPart &&
        normalizeExerciseSearch(item.bodyPart) !== bodyPart
      ) {
        return false;
      }

      if (
        equipment &&
        normalizeExerciseSearch(item.equipment) !== equipment
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return normalizeExerciseSearch(
        [
          item.name,
          item.nameVi,
          item.bodyPart,
          item.bodyPartVi,
          item.equipment,
          item.equipmentVi,
          item.target,
          item.targetVi,
          item.muscleGroup,
          item.muscleGroupVi,
          ...item.secondaryMuscles,
        ].join(" "),
      ).includes(query);
    });

    return NextResponse.json(
      {
        items: matches.slice(0, limit),
        total: matches.length,
        catalogTotal: catalog.length,
        bodyParts,
        equipments,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    console.error("Could not load exercise catalog", error);

    return NextResponse.json(
      { error: "Exercise catalog is temporarily unavailable." },
      { status: 503 },
    );
  }
}
