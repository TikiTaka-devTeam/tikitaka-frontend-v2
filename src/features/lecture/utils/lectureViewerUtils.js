export function getStrokeId(stroke) {
  return stroke?.id ?? stroke?.strokeId ?? stroke?.stroke_id ?? "";
}

export function getStateValue(state, camelKey, snakeKey) {
  return state?.[camelKey] ?? state?.[snakeKey] ?? "";
}

function normalizeSlide(slide, index) {
  return {
    ...slide,
    id: slide.id ?? slide.slideId ?? slide.slide_id ?? "",
    pageNumber:
      Number(
        slide.pageNumber ??
          slide.page_number ??
          index + 1,
      ) ||
      index + 1,
  };
}

export function normalizeSlides(slides) {
  if (!Array.isArray(slides)) {
    return [];
  }

  return slides
    .map(normalizeSlide)
    .filter((slide) => Boolean(slide.id))
    .sort(
      (first, second) =>
        first.pageNumber -
        second.pageNumber,
    );
}

export function extractPdfUrl(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof URL !== "undefined" &&
    value instanceof URL
  ) {
    return value.href;
  }

  if (typeof value === "object") {
    const nestedValue =
      value.url ??
      value.href ??
      value.pdf_url ??
      value.pdfUrl ??
      value.download_url ??
      value.downloadUrl ??
      value.file_url ??
      value.fileUrl ??
      "";

    if (nestedValue === value) {
      return "";
    }

    return extractPdfUrl(
      nestedValue,
    );
  }

  return "";
}

function unwrapSlidesResponse(response) {
  if (!response) {
    return {};
  }

  if (
    response.data &&
    typeof response.data === "object"
  ) {
    return response.data;
  }

  if (
    response.result &&
    typeof response.result === "object"
  ) {
    return response.result;
  }

  if (
    response.payload &&
    typeof response.payload === "object"
  ) {
    return response.payload;
  }

  return response;
}

export function normalizeSlidesResponse(
  response,
) {
  const payload =
    unwrapSlidesResponse(
      response,
    );

  const normalizedSlides =
    normalizeSlides(
      payload?.slides ??
        response?.slides ??
        [],
    );

  const rawPdfUrl =
    payload?.pdf_url ??
    payload?.pdfUrl ??
    payload?.document?.pdf_url ??
    payload?.document?.pdfUrl ??
    response?.pdf_url ??
    response?.pdfUrl ??
    "";

  const pdfUrl =
    extractPdfUrl(
      rawPdfUrl,
    );

  const pageCount =
    Number(
      payload?.page_count ??
        payload?.pageCount ??
        response?.page_count ??
        response?.pageCount ??
        normalizedSlides.length,
    ) ||
    normalizedSlides.length;

  return {
    pdfUrl,
    pageCount,
    slides: normalizedSlides,
  };
}