export const TIMELINE_WORKOUT_LOG_NOTE = "[lifeos:timeline]";

export function isTimelineWorkoutLog(note: string | null | undefined) {
  return note === TIMELINE_WORKOUT_LOG_NOTE;
}
