export const TOOL_THICKNESS_DEFAULTS = {
  PEN: 0.0045,
  HIGHLIGHTER: 0.012,
  ERASER: 0.016,
};

export const TOOL_COLORS = {
  PEN: "#212326",
  HIGHLIGHTER: "#FACC15",
};

export function createUuid() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

export function normalizeStroke(stroke) {
  return {
    id:
      stroke.stroke_id ??
      stroke.strokeId ??
      stroke.id,

    tool: stroke.tool,

    points: (stroke.points ?? []).map((point) => ({
      x:
        point.x_ratio ??
        point.xRatio ??
        point.x ??
        0,

      y:
        point.y_ratio ??
        point.yRatio ??
        point.y ??
        0,
    })),

    color: stroke.color ?? "#212326",

    thickness: Number(
      stroke.thickness ??
        TOOL_THICKNESS_DEFAULTS.PEN,
    ),

    opacity: Number(stroke.opacity ?? 1),

    strokeOrder:
      stroke.stroke_order ??
      stroke.strokeOrder ??
      0,

    isDeleted: Boolean(
      stroke.is_deleted ??
        stroke.isDeleted,
    ),
  };
}

export function toStrokeRequest(
  stroke,
  clientStrokeId,
) {
  return {
    client_stroke_id: clientStrokeId,

    tool: stroke.tool,

    points: stroke.points.map((point) => ({
      x_ratio: point.x,
      y_ratio: point.y,
    })),

    color: stroke.color,
    thickness: stroke.thickness,
    opacity: stroke.opacity,
    stroke_order: stroke.strokeOrder,
  };
}

export function normalizeQuestion(question) {
  return {
    id:
      question.question_id ??
      question.questionId ??
      question.id,

    title: question.title ?? "",
    content: question.content ?? "",

    xRatio:
      question.x_ratio ??
      question.xRatio ??
      null,

    yRatio:
      question.y_ratio ??
      question.yRatio ??
      null,

    likeCount:
      question.like_count ??
      question.likeCount ??
      0,

    liked: Boolean(question.liked),

    status: question.status ?? "PENDING",
    slide: question.slide ?? null,
    categories: question.categories ?? [],
    answers: question.answers ?? [],
    comments: question.comments ?? [],
  };
}

export function normalizeFixer(fixer) {
  return {
    id:
      fixer.fixer_id ??
      fixer.fixerId ??
      fixer.id,

    xRatio:
      fixer.x_ratio ??
      fixer.xRatio ??
      0,

    yRatio:
      fixer.y_ratio ??
      fixer.yRatio ??
      0,

    content: fixer.content ?? "",

    isChecked: Boolean(
      fixer.is_checked ??
        fixer.isChecked,
    ),
  };
}

export function normalizeSlidesResponse(data) {
  return {
    documentId:
      data?.document_id ??
      data?.documentId ??
      "",

    pdfUrl:
      data?.pdf_url ??
      data?.pdfUrl ??
      "",

    pageCount: Number(
      data?.page_count ??
        data?.pageCount ??
        0,
    ),

    slides: (data?.slides ?? []).map((slide) => ({
      id:
        slide.slide_id ??
        slide.slideId ??
        slide.id,

      pageNumber: Number(
        slide.page_number ??
          slide.pageNumber ??
          1,
      ),

      pageWidth:
        slide.page_width ??
        slide.pageWidth ??
        null,

      pageHeight:
        slide.page_height ??
        slide.pageHeight ??
        null,
    })),
  };
}