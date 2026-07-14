export type SkillTaskDetailNote = {
  lessonUrl: string;
  notes: string;
  result: string;
};

const detailPrefix = "__lifeos_skill_task_detail__";

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseSkillTaskDetailNote(
  note: string | null | undefined,
): SkillTaskDetailNote {
  if (!note) {
    return {
      lessonUrl: "",
      notes: "",
      result: "",
    };
  }

  if (note.startsWith(detailPrefix)) {
    try {
      const parsed = JSON.parse(note.slice(detailPrefix.length)) as Partial<SkillTaskDetailNote>;

      return {
        lessonUrl: parsed.lessonUrl ?? "",
        notes: parsed.notes ?? "",
        result: parsed.result ?? "",
      };
    } catch {
      return {
        lessonUrl: "",
        notes: note,
        result: "",
      };
    }
  }

  if (isUrl(note)) {
    return {
      lessonUrl: note,
      notes: "",
      result: "",
    };
  }

  return {
    lessonUrl: "",
    notes: note,
    result: "",
  };
}

export function serializeSkillTaskDetailNote(detail: SkillTaskDetailNote) {
  const cleaned = {
    lessonUrl: detail.lessonUrl.trim(),
    notes: detail.notes.trim(),
    result: detail.result.trim(),
  };

  if (!cleaned.lessonUrl && !cleaned.notes && !cleaned.result) {
    return null;
  }

  return `${detailPrefix}${JSON.stringify(cleaned)}`;
}

export function formatSkillTaskTimelineNote(detail: SkillTaskDetailNote) {
  const rows = [
    detail.lessonUrl.trim() ? `Lesson: ${detail.lessonUrl.trim()}` : "",
    detail.notes.trim() ? `Notes: ${detail.notes.trim()}` : "",
    detail.result.trim() ? `Result: ${detail.result.trim()}` : "",
  ].filter(Boolean);

  return rows.length > 0 ? rows.join("\n") : null;
}

export function skillTaskHasResource(note: string | null | undefined) {
  const detail = parseSkillTaskDetailNote(note);

  return Boolean(detail.lessonUrl || detail.notes || detail.result);
}
