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
      new Set(catalog.map((item) => item.bodyPart).filter(Boolean)),
    )
      .sort((first, second) => first.localeCompare(second));
    const equipments = Array.from(
      new Set(catalog.map((item) => item.equipment).filter(Boolean)),
    )
      .sort((first, second) => first.localeCompare(second));
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
          item.bodyPart,
          item.equipment,
          item.target,
          item.muscleGroup,
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
