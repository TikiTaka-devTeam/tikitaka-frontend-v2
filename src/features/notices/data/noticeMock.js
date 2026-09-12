export const MOCK_NOTICE_LIST = {
  total_count: 1,
  unread_count: 1,
  notices: [
    {
      notice_id: "mock-notice-1",
      title: "중간 발표 일정 안내",
      content_preview:
        "안녕하세요. 중간발표 일정과 제출 방법을 안내합니다.",
      created_at: "2026-07-20T10:30:00+09:00",
      is_read: false,
    },
  ],
  next_cursor: null,
  has_next: false,
};

export const MOCK_NOTICE_DETAILS = {
  "mock-notice-1": {
    notice_id: "mock-notice-1",
    title: "중간 발표 일정 안내",
    created_at: "2026-07-20T10:30:00+09:00",
    author_name: "김승훈 교수",
    view_count: 34,
    is_read: true,
    read_at: "2026-07-20T10:35:00+09:00",
    content: `안녕하세요. 중간 발표 일정과 제출 방법을 안내합니다.

발표는 팀별 10분 발표와 5분 질의응답으로 진행됩니다.
발표 자료는 수업 시작 전까지 강의자료 공간에 업로드해주세요.

발표 순서는 아래와 같습니다.

1조  13:00 – 13:15
2조  13:15 – 13:30
3조  13:30 – 13:45
4조  13:45 – 14:00`,
    files: [
      {
        file_id: "mock-file-1",
        file_name: "발표_순서표.pdf",
        file_size_text: "1.2 MB",
        file_url: "#",
      },
      {
        file_id: "mock-file-2",
        file_name: "발표_순서표22.pdf",
        file_size_text: "2.2 MB",
        file_url: "#",
      },
    ],
  },
};