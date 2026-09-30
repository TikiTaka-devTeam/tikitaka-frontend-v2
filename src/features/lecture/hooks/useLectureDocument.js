import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useParams,
} from "react-router-dom";

import {
  getDocumentSlides,
} from "../api/lectureApi";

import {
  extractPdfUrl,
  getStateValue,
  normalizeSlides,
  normalizeSlidesResponse,
} from "../utils/lectureViewerUtils";

export default function useLectureDocument({
  documentId: documentIdProp,
  pdfUrl: pdfUrlProp,
  slides: slidesProp,
  pageCount: pageCountProp,
  documentTitle:
    documentTitleProp,
  spaceName: spaceNameProp,
  slideId: slideIdProp,
  setToast,
}) {
  const location =
    useLocation();

  const params =
    useParams();

  const navigationState =
    location.state ?? {};

  const spaceId =
    params.spaceId ??
    params.space_id ??
    getStateValue(
      navigationState,
      "spaceId",
      "space_id",
    );

  const documentId =
    documentIdProp ??
    params.documentId ??
    params.document_id ??
    getStateValue(
      navigationState,
      "documentId",
      "document_id",
    );

  const initialPdfUrl =
    extractPdfUrl(
      pdfUrlProp ??
        navigationState.pdfUrl ??
        navigationState.pdf_url ??
        navigationState.document
          ?.pdfUrl ??
        navigationState.document
          ?.pdf_url ??
        "",
    );

  const documentTitle =
    documentTitleProp ??
    navigationState.documentTitle ??
    navigationState.document_title ??
    navigationState.document
      ?.title ??
    "";

  const spaceName =
    spaceNameProp ??
    navigationState.spaceName ??
    navigationState.space_name ??
    navigationState.space
      ?.spaceName ??
    navigationState.space
      ?.space_name ??
    "";

  const initialSlideId =
    slideIdProp ??
    params.slideId ??
    params.slide_id ??
    getStateValue(
      navigationState,
      "slideId",
      "slide_id",
    );

  const initialSlides =
    useMemo(
      () =>
        normalizeSlides(
          slidesProp ??
            navigationState.slides ??
            navigationState.document
              ?.slides ??
            [],
        ),
      [
        slidesProp,
        navigationState.slides,
        navigationState.document
          ?.slides,
      ],
    );

  const initialPageCount =
    Number(
      pageCountProp ??
        navigationState.pageCount ??
        navigationState.page_count ??
        navigationState.document
          ?.pageCount ??
        navigationState.document
          ?.page_count ??
        initialSlides.length,
    ) ||
    initialSlides.length;

  const initialSlideIndex =
    useMemo(() => {
      if (
        !initialSlideId ||
        !initialSlides.length
      ) {
        return 0;
      }

      const index =
        initialSlides.findIndex(
          (slide) =>
            String(slide.id) ===
            String(
              initialSlideId,
            ),
        );

      return index >= 0
        ? index
        : 0;
    }, [
      initialSlideId,
      initialSlides,
    ]);

  const [
    pdfUrl,
    setPdfUrl,
  ] = useState(
    initialPdfUrl,
  );

  const [
    slides,
    setSlides,
  ] = useState(
    initialSlides,
  );

  const [
    pageCount,
    setPageCount,
  ] = useState(
    initialPageCount,
  );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(
    initialSlideIndex,
  );

  useEffect(() => {
    if (!documentId) {
      return undefined;
    }

    let cancelled = false;

    async function loadDocument() {
      try {
        const response =
          await getDocumentSlides(
            documentId,
          );

        if (cancelled) {
          return;
        }

        const normalized =
          normalizeSlidesResponse(
            response,
          );

        if (
          !normalized.pdfUrl
        ) {
          setToast(
            "PDF 주소를 불러오지 못했습니다.",
          );
        }

        setPdfUrl(
          normalized.pdfUrl,
        );

        setSlides(
          normalized.slides,
        );

        setPageCount(
          normalized.pageCount ||
            normalized.slides
              .length,
        );

        const nextIndex =
          initialSlideId
            ? normalized.slides.findIndex(
                (slide) =>
                  String(
                    slide.id,
                  ) ===
                  String(
                    initialSlideId,
                  ),
              )
            : 0;

        setCurrentIndex(
          nextIndex >= 0
            ? nextIndex
            : 0,
        );
      } catch (error) {
        if (!cancelled) {
          setToast(
            error?.response
              ?.data
              ?.message ??
              error?.response
                ?.data
                ?.detail ??
              "강의자료를 불러오지 못했습니다.",
          );
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [
    documentId,
    initialSlideId,
    setToast,
  ]);

  const currentSlide =
    slides[currentIndex] ??
    null;

  const currentSlideId =
    currentSlide?.id ?? "";

  const currentPage =
    currentSlide
      ?.pageNumber ??
    currentIndex + 1;

  const totalPages =
    pageCount ||
    slides.length;

  return {
    spaceId,
    documentId,
    documentTitle,
    spaceName,
    pdfUrl,
    slides,
    currentIndex,
    setCurrentIndex,
    currentSlideId,
    currentPage,
    totalPages,
  };
}