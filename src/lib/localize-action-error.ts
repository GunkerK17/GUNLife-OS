import type { Locale } from "@/lib/i18n";

type LocalizedMessage = Record<Locale, string>;

const exactMessages: Record<string, LocalizedMessage> = {
  "Supabase is not configured yet.": {
    en: "Supabase is not configured yet.",
    vi: "Supabase chưa được cấu hình.",
  },
  "Supabase chưa được cấu hình.": {
    en: "Supabase is not configured yet.",
    vi: "Supabase chưa được cấu hình.",
  },
  "You need to sign in first.": {
    en: "You need to sign in first.",
    vi: "Bạn cần đăng nhập trước.",
  },
  "Bạn cần đăng nhập trước.": {
    en: "You need to sign in first.",
    vi: "Bạn cần đăng nhập trước.",
  },
  "Activity photo must be a JPG, PNG, WEBP, or GIF image.": {
    en: "Activity photo must be a JPG, PNG, WEBP, or GIF image.",
    vi: "Ảnh hoạt động phải có định dạng JPG, PNG, WEBP hoặc GIF.",
  },
  "Food photo must be a JPG, PNG, WEBP, or GIF image.": {
    en: "Food photo must be a JPG, PNG, WEBP, or GIF image.",
    vi: "Ảnh món ăn phải có định dạng JPG, PNG, WEBP hoặc GIF.",
  },
  "Body photo must be a JPG, PNG, WEBP, or GIF image.": {
    en: "Body photo must be a JPG, PNG, WEBP, or GIF image.",
    vi: "Ảnh cơ thể phải có định dạng JPG, PNG, WEBP hoặc GIF.",
  },
  "Workout photo must be a JPG, PNG, WEBP, or GIF image.": {
    en: "Workout photo must be a JPG, PNG, WEBP, or GIF image.",
    vi: "Ảnh buổi tập phải có định dạng JPG, PNG, WEBP hoặc GIF.",
  },
  "Activity photo must be smaller than 5MB.": {
    en: "Activity photo must be smaller than 5MB.",
    vi: "Ảnh hoạt động phải nhỏ hơn 5MB.",
  },
  "Food photo must be smaller than 5MB.": {
    en: "Food photo must be smaller than 5MB.",
    vi: "Ảnh món ăn phải nhỏ hơn 5MB.",
  },
  "Body photo must be smaller than 5MB.": {
    en: "Body photo must be smaller than 5MB.",
    vi: "Ảnh cơ thể phải nhỏ hơn 5MB.",
  },
  "Workout photo must be smaller than 5MB.": {
    en: "Workout photo must be smaller than 5MB.",
    vi: "Ảnh buổi tập phải nhỏ hơn 5MB.",
  },
  "Food name is required.": {
    en: "Food name is required.",
    vi: "Vui lòng nhập tên món ăn.",
  },
  "Image link must be a valid URL.": {
    en: "Image link must be a valid URL.",
    vi: "Đường dẫn ảnh không hợp lệ.",
  },
  "Video link must be a valid URL.": {
    en: "Video link must be a valid URL.",
    vi: "Đường dẫn video không hợp lệ.",
  },
  "Start time is not valid.": {
    en: "Start time is not valid.",
    vi: "Giờ bắt đầu không hợp lệ.",
  },
  "End time is not valid.": {
    en: "End time is not valid.",
    vi: "Giờ kết thúc không hợp lệ.",
  },
  "Add a start time if you set an end time.": {
    en: "Add a start time if you set an end time.",
    vi: "Hãy nhập giờ bắt đầu khi đã chọn giờ kết thúc.",
  },
  "Saving as a preset needs a start time and either an end time or duration.": {
    en: "Saving as a preset needs a start time and either an end time or duration.",
    vi: "Preset cần giờ bắt đầu và giờ kết thúc hoặc thời lượng.",
  },
  "Choose a workout plan or use Manual gym block.": {
    en: "Choose a workout plan or use Manual gym block.",
    vi: "Hãy chọn giáo án hoặc dùng block Gym thủ công.",
  },
  "Workout plans can only be linked to Gym blocks.": {
    en: "Workout plans can only be linked to Gym blocks.",
    vi: "Giáo án tập chỉ có thể liên kết với block Gym.",
  },
  "Choose a workout photo first.": {
    en: "Choose a workout photo first.",
    vi: "Hãy chọn ảnh buổi tập trước.",
  },
  "Workout plan not found.": {
    en: "Workout plan not found.",
    vi: "Không tìm thấy giáo án tập.",
  },
  "Workout log not found.": {
    en: "Workout log not found.",
    vi: "Không tìm thấy nhật ký buổi tập.",
  },
  "Timeline block not found.": {
    en: "Timeline block not found.",
    vi: "Không tìm thấy block Lịch ngày.",
  },
  "Template not found.": {
    en: "Template not found.",
    vi: "Không tìm thấy preset.",
  },
  "Vui lòng chọn tài khoản nhận.": {
    en: "Please choose a receiving account.",
    vi: "Vui lòng chọn tài khoản nhận.",
  },
  "Tài khoản gửi và nhận phải khác nhau.": {
    en: "The sending and receiving accounts must be different.",
    vi: "Tài khoản gửi và nhận phải khác nhau.",
  },
  "Tài khoản không hợp lệ.": {
    en: "The account is invalid.",
    vi: "Tài khoản không hợp lệ.",
  },
  "Tài khoản gửi hoặc nhận không hợp lệ.": {
    en: "The sending or receiving account is invalid.",
    vi: "Tài khoản gửi hoặc nhận không hợp lệ.",
  },
  "Không tìm thấy giao dịch.": {
    en: "Transaction not found.",
    vi: "Không tìm thấy giao dịch.",
  },
  "Giao dịch không hợp lệ.": {
    en: "The transaction is invalid.",
    vi: "Giao dịch không hợp lệ.",
  },
  "Vui lòng nhập số tiền mục tiêu cần tiết kiệm.": {
    en: "Please enter the savings target amount.",
    vi: "Vui lòng nhập số tiền mục tiêu cần tiết kiệm.",
  },
  "Ngày nhật ký không hợp lệ.": {
    en: "The journal date is invalid.",
    vi: "Ngày nhật ký không hợp lệ.",
  },
  "Không tìm thấy cuộc trò chuyện.": {
    en: "Conversation not found.",
    vi: "Không tìm thấy cuộc trò chuyện.",
  },
  "Invalid conversation.": {
    en: "Invalid conversation.",
    vi: "Cuộc trò chuyện không hợp lệ.",
  },
  "Gemini không trả về nội dung.": {
    en: "Gemini did not return any content.",
    vi: "Gemini không trả về nội dung.",
  },
  "GEMINI_API_KEY chưa được cấu hình trong .env.local.": {
    en: "GEMINI_API_KEY is not configured in .env.local.",
    vi: "GEMINI_API_KEY chưa được cấu hình trong .env.local.",
  },
};

export function localizeActionError(error: string, locale: Locale) {
  const normalized = error.trim();
  const exact = exactMessages[normalized];

  if (exact) {
    return exact[locale];
  }

  if (locale === "vi") {
    if (/must be .*image/i.test(normalized)) {
      return "Ảnh phải có định dạng JPG, PNG, WEBP hoặc GIF.";
    }
    if (/smaller than 5mb/i.test(normalized)) {
      return "Ảnh phải nhỏ hơn 5MB.";
    }
    if (/valid url/i.test(normalized)) {
      return "Đường dẫn không hợp lệ.";
    }
    if (/not configured/i.test(normalized)) {
      return "Dịch vụ chưa được cấu hình.";
    }
    if (/sign in/i.test(normalized)) {
      return "Bạn cần đăng nhập trước.";
    }
    if (/not found/i.test(normalized)) {
      return "Không tìm thấy dữ liệu cần thao tác.";
    }
    if (/^(invalid|missing)\b/i.test(normalized)) {
      return "Dữ liệu không hợp lệ hoặc còn thiếu.";
    }
    if (/required/i.test(normalized)) {
      return "Vui lòng nhập đầy đủ thông tin bắt buộc.";
    }
    if (/^(could not|failed|unable)/i.test(normalized)) {
      return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
    }

    return /[À-ỹ]/.test(normalized)
      ? normalized
      : "Không thể hoàn tất thao tác. Vui lòng thử lại.";
  }

  if (/[À-ỹ]/.test(normalized)) {
    if (/đăng nhập/i.test(normalized)) {
      return "You need to sign in first.";
    }
    if (/không tìm thấy/i.test(normalized)) {
      return "The requested data was not found.";
    }
    if (/không hợp lệ/i.test(normalized)) {
      return "The submitted data is invalid.";
    }
    if (/chưa được cấu hình/i.test(normalized)) {
      return "The service is not configured yet.";
    }

    return "Could not complete the action. Please try again.";
  }

  return normalized;
}
