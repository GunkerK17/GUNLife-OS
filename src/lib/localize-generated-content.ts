import type { Locale } from "@/lib/i18n";

const systemTextTranslations = [
  ["Morning Routine", "Thói quen buổi sáng"],
  ["Workout", "Tập luyện"],
  ["Work / Study", "Làm việc / Học tập"],
  ["Review & Planning", "Xem lại & Lên kế hoạch"],
  ["Lunch", "Ăn trưa"],
  ["Project Work", "Làm dự án"],
  ["Learning", "Học tập"],
  ["Read a Book", "Đọc sách"],
  ["Night Routine", "Thói quen buổi tối"],
] as const;

const generatedTaskTranslations = [
  ["Review wins, blockers, and next week priority", "Xem lại kết quả, trở ngại và ưu tiên tuần tới"],
  ["Check balances, debt, and the remaining target", "Kiểm tra số dư, khoản nợ và mục tiêu còn thiếu"],
  ["Transfer the planned amount into the linked savings wallet", "Chuyển số tiền dự kiến vào ví tiết kiệm đã liên kết"],
  ["Summarize saved money, cash flow, and next action", "Tổng kết tiền đã tiết kiệm, dòng tiền và việc tiếp theo"],
  ["Train main muscle group and log sets, reps, kg", "Tập nhóm cơ chính và ghi lại set, rep, kg"],
  ["Walk, run, bike, or football and record calories/heart rate", "Đi bộ, chạy, đạp xe hoặc đá bóng và ghi calo/nhịp tim"],
  ["Hit protein, water, and record meals", "Đạt mục tiêu protein, nước và ghi lại bữa ăn"],
  ["Train a different muscle group and log volume", "Tập nhóm cơ khác và ghi tổng khối lượng"],
  ["Record weight, body photo, sleep, and energy", "Ghi cân nặng, ảnh cơ thể, giấc ngủ và năng lượng"],
  ["Do sport, core, mobility, or a lighter session", "Chơi thể thao, tập core, giãn cơ hoặc buổi nhẹ"],
  ["Stretch, recover, and plan next week", "Giãn cơ, phục hồi và lên kế hoạch tuần tới"],
  ["Work on the highest-impact project task", "Làm việc quan trọng nhất của dự án"],
  ["Study one focused lesson and write notes", "Học một bài tập trung và ghi chú"],
  ["Ship a small visible improvement", "Hoàn thành một cải tiến nhỏ có thể nhìn thấy"],
  ["Reach out, apply, or ask for feedback", "Kết nối, ứng tuyển hoặc xin phản hồi"],
  ["Fix one weak point from recent work", "Khắc phục một điểm yếu trong công việc gần đây"],
  ["Do a timed task or mock interview", "Làm bài có giới hạn thời gian hoặc phỏng vấn thử"],
  ["Avoid one unnecessary expense today", "Tránh một khoản chi không cần thiết hôm nay"],
  ["Complete one action that can increase income", "Hoàn thành một việc có thể tăng thu nhập"],
  ["Review spending categories and remaining limits", "Xem lại nhóm chi tiêu và hạn mức còn lại"],
  ["Review pay-later debt and the next due date", "Xem lại dư nợ trả sau và hạn thanh toán kế tiếp"],
  ["Learn the key concept or vocabulary set", "Học khái niệm chính hoặc nhóm từ vựng"],
  ["Listen, read, or watch one focused lesson", "Nghe, đọc hoặc xem một bài học tập trung"],
  ["Do drills and record mistakes", "Luyện tập và ghi lại lỗi sai"],
  ["Speak, write, code, or create a small result", "Nói, viết, code hoặc tạo một kết quả nhỏ"],
  ["Recall from memory and fix weak points", "Ôn lại bằng trí nhớ và sửa điểm yếu"],
  ["Do a mini test or real-world task", "Làm bài kiểm tra nhỏ hoặc nhiệm vụ thực tế"],
  ["Summarize progress and choose next focus", "Tổng kết tiến độ và chọn trọng tâm tiếp theo"],
  ["Do the smallest useful action", "Làm hành động hữu ích nhỏ nhất"],
  ["Repeat the core habit with a small improvement", "Lặp lại thói quen chính với một cải tiến nhỏ"],
  ["Record proof, score, or notes", "Ghi bằng chứng, điểm số hoặc ghi chú"],
  ["Remove one blocker or friction point", "Loại bỏ một trở ngại"],
  ["Check what worked and what did not", "Kiểm tra điều hiệu quả và chưa hiệu quả"],
  ["Try a harder version of the action", "Thử phiên bản khó hơn của hành động"],
  ["Prepare the next week clearly", "Chuẩn bị rõ ràng cho tuần tiếp theo"],
  ["Write why this matters and what today needs", "Viết lý do việc này quan trọng và điều hôm nay cần làm"],
  ["Do the core personal habit", "Thực hiện thói quen cá nhân chính"],
  ["Journal what changed and what felt hard", "Ghi lại điều đã thay đổi và phần khó khăn"],
  ["Make the habit easier to repeat tomorrow", "Làm cho thói quen dễ lặp lại hơn vào ngày mai"],
  ["Check progress and adjust expectations", "Kiểm tra tiến độ và điều chỉnh kỳ vọng"],
  ["Do one action that supports relationships or identity", "Làm một việc hỗ trợ mối quan hệ hoặc bản sắc cá nhân"],
  ["Rest, organize, and plan the next cycle", "Nghỉ ngơi, sắp xếp và lên kế hoạch chu kỳ tiếp theo"],
  ["Study one lesson and write 3 useful notes", "Học một bài và viết 3 ghi chú hữu ích"],
  ["Practice the smallest repeatable exercise", "Luyện bài nhỏ nhất có thể lặp lại"],
  ["Use the skill in one tiny real output", "Ứng dụng kỹ năng vào một sản phẩm nhỏ"],
  ["Compare with a reference and fix mistakes", "So sánh với mẫu và sửa lỗi"],
  ["Review without notes and summarize from memory", "Ôn không nhìn ghi chú và tóm tắt bằng trí nhớ"],
  ["Do a timed challenge or mini project", "Làm thử thách có thời gian hoặc dự án nhỏ"],
  ["Log what improved and choose the next weak point", "Ghi điều đã tiến bộ và chọn điểm yếu tiếp theo"],
  ["Portfolio output", "Sản phẩm portfolio"],
  ["Weekly money review", "Tổng kết tài chính tuần"],
  ["Nutrition check", "Kiểm tra dinh dưỡng"],
  ["Recovery review", "Xem lại phục hồi"],
  ["Money snapshot", "Tổng quan tài chính"],
  ["No-spend check", "Ngày không chi tiêu"],
  ["Income action", "Hành động tăng thu nhập"],
  ["Budget check", "Kiểm tra ngân sách"],
  ["Debt check", "Kiểm tra khoản nợ"],
  ["Weekly reset", "Tổng kết tuần"],
  ["Skill upgrade", "Nâng cấp kỹ năng"],
  ["Body check", "Check body"],
  ["Strength A", "Sức mạnh A"],
  ["Strength B", "Sức mạnh B"],
  ["Conditioning", "Thể lực"],
  ["Foundation", "Nền tảng"],
  ["Challenge", "Thử thách"],
  ["Reflection", "Phản tư"],
  ["Environment", "Môi trường"],
  ["Connection", "Kết nối"],
  ["Understand", "Hiểu bài"],
  ["Feedback", "Phản hồi"],
  ["Practice", "Luyện tập"],
  ["Deep work", "Tập trung sâu"],
  ["Cardio", "Cardio"],
  ["Review", "Ôn tập"],
  ["Output", "Đầu ra"],
  ["Recall", "Gợi nhớ"],
  ["Clarity", "Làm rõ"],
  ["Network", "Kết nối"],
  ["Improve", "Cải thiện"],
  ["Stretch", "Mở rộng"],
  ["Reset", "Đặt lại"],
  ["Build", "Xây dựng"],
  ["Push", "Tăng tốc"],
  ["Input", "Đầu vào"],
  ["Apply", "Áp dụng"],
  ["Drill", "Luyện kỹ"],
  ["Track", "Theo dõi"],
  ["Start", "Bắt đầu"],
  ["Save", "Tiết kiệm"],
] as const;

function replaceKnownPhrases(value: string, locale: Locale) {
  const translations =
    locale === "vi"
      ? generatedTaskTranslations
      : generatedTaskTranslations.map(([en, vi]) => [vi, en] as const);

  return [...translations]
    .sort((first, second) => second[0].length - first[0].length)
    .reduce(
      (result, [source, target]) => result.split(source).join(target),
      value,
    );
}

export function localizeGeneratedTaskDescription(
  description: string,
  locale: Locale,
) {
  const exactSystemText = systemTextTranslations.find(
    ([en, vi]) => description === en || description === vi,
  );

  if (exactSystemText) {
    return locale === "vi" ? exactSystemText[1] : exactSystemText[0];
  }

  if (!/^(Day|Ngày) \d+ - /.test(description)) {
    return description;
  }

  let localized = replaceKnownPhrases(description, locale);

  if (locale === "vi") {
    localized = localized
      .replace(/^Day (\d+) - /, "Ngày $1 - ")
      .replace(/\. Core: /g, ". Trọng tâm: ")
      .replace(/ - Week (\d+): /g, " - Tuần $1: ")
      .replace(/ for ([^.]+)\. Trọng tâm:/g, " cho $1. Trọng tâm:");
  } else {
    localized = localized
      .replace(/^Ngày (\d+) - /, "Day $1 - ")
      .replace(/\. Trọng tâm: /g, ". Core: ")
      .replace(/ - Tuần (\d+): /g, " - Week $1: ")
      .replace(/ cho ([^.]+)\. Core:/g, " for $1. Core:");
  }

  return localized;
}

export function localizeGeneratedTimelineNote(note: string | null, locale: Locale) {
  const systemNotes = [
    ["Meditation • 15 min", "Thiền • 15 phút"],
    ["Upper Body Strength", "Sức mạnh thân trên"],
    ["Deep Work Session", "Phiên tập trung sâu"],
    ["Review tasks and plan", "Xem lại công việc và lên kế hoạch"],
    ["Healthy & Balanced", "Lành mạnh & Cân bằng"],
    ["LifeOS Development", "Phát triển LifeOS"],
  ] as const;
  const exactSystemNote = systemNotes.find(
    ([en, vi]) => note === en || note === vi,
  );

  if (exactSystemNote) {
    return locale === "vi" ? exactSystemNote[1] : exactSystemNote[0];
  }

  if (note === "Goal daily task") {
    return locale === "vi" ? "Việc hằng ngày của Mục tiêu" : note;
  }

  if (note === "Skill daily task") {
    return locale === "vi" ? "Bài luyện tập Kỹ năng" : note;
  }

  if (note === "Added from preset") {
    return locale === "vi" ? "Đã thêm từ preset" : note;
  }

  return note;
}
