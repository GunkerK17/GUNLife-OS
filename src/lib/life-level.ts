export type LifeLevel = {
  age: number;
  daysElapsed: number;
  daysInLevel: number;
  daysUntilNextLevel: number;
  nextAge: number;
  progress: number;
};

function dateOnlyUtc(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function birthdayInYear(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay)));
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

export function getLifeLevel(
  dateOfBirth?: string | null,
  currentDate = new Date(),
): LifeLevel | null {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return null;
  }

  const [birthYear, birthMonth, birthDay] = dateOfBirth.split("-").map(Number);
  const today = dateOnlyUtc(currentDate);
  const thisYearBirthday = birthdayInYear(
    today.getUTCFullYear(),
    birthMonth,
    birthDay,
  );
  const birthdayPassed = today >= thisYearBirthday;
  const age =
    today.getUTCFullYear() - birthYear - (birthdayPassed ? 0 : 1);

  if (age < 0) {
    return null;
  }

  const lastBirthdayYear = birthdayPassed
    ? today.getUTCFullYear()
    : today.getUTCFullYear() - 1;
  const lastBirthday = birthdayInYear(
    lastBirthdayYear,
    birthMonth,
    birthDay,
  );
  const nextBirthday = birthdayInYear(
    lastBirthdayYear + 1,
    birthMonth,
    birthDay,
  );
  const daysInLevel = Math.max(1, daysBetween(lastBirthday, nextBirthday));
  const daysElapsed = Math.min(daysInLevel, daysBetween(lastBirthday, today));

  return {
    age,
    daysElapsed,
    daysInLevel,
    daysUntilNextLevel: Math.max(0, daysInLevel - daysElapsed),
    nextAge: age + 1,
    progress: Math.min(100, Math.round((daysElapsed / daysInLevel) * 100)),
  };
}
