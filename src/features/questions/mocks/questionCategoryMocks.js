// TODO: Category API 데이터가 준비되면 이 파일과 각 화면의 fallback 참조만 제거한다.
export const MOCK_QUESTION_CATEGORIES = [
  "PWM · 타이머",
  "타이머 계산",
  "주파수 비교",
  "GPIO 설정",
  "인터럽트",
  "스레드",
  "프로세스",
  "페이징",
  "메모리",
  "파일 시스템",
  "캐시",
  "동기화",
  "시스템 콜",
].map((name, index) => ({
  category_id: `mock-question-category-${index + 1}`,
  name,
  source: "AI",
  isMock: true,
}));

export const MOCK_QUESTION_PREVIEW_CATEGORIES =
  MOCK_QUESTION_CATEGORIES.slice(0, 3);
