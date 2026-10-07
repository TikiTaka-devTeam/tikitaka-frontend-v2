import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  clamp,
} from "../utils/drawingUtils.js";

GlobalWorkerOptions.workerSrc =
  pdfWorker;

export default function usePdfPageRender({
  pdfUrl,
  pageNumber,
  zoom,
  onPageMetrics,
}) {
  const containerRef =
    useRef(null);

  const pdfCanvasRef =
    useRef(null);

  const [
    pdfDocument,
    setPdfDocument,
  ] = useState(null);

  const [
    pdfDocumentUrl,
    setPdfDocumentUrl,
  ] = useState("");

  const [
    viewportSize,
    setViewportSize,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    pageSize,
    setPageSize,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const normalizedPdfUrl =
    typeof pdfUrl ===
    "string"
      ? pdfUrl.trim()
      : "";

  const visibleErrorMessage =
    !normalizedPdfUrl
      ? pdfUrl
        ? "PDF 주소 형식이 올바르지 않습니다."
        : ""
      : errorMessage;

  const [previousPdfUrl, setPreviousPdfUrl] = useState(normalizedPdfUrl);
  if (previousPdfUrl !== normalizedPdfUrl) {
    setPreviousPdfUrl(normalizedPdfUrl);
    setPdfDocument(null);
    setPdfDocumentUrl("");
    setPageSize({ width: 0, height: 0 });
    setErrorMessage("");
  }

  useEffect(() => {
    if (!normalizedPdfUrl) return undefined;

    let cancelled =
      false;

    const loadingTask =
      getDocument({
        url:
          normalizedPdfUrl,
      });

    loadingTask.promise
      .then(
        (
          loadedDocument,
        ) => {
          if (cancelled) {
            loadedDocument.destroy();

            return;
          }

          setPdfDocument(
            loadedDocument,
          );

          setPdfDocumentUrl(
            normalizedPdfUrl,
          );

          setErrorMessage("");
        },
      )
      .catch(
        (error) => {
          if (cancelled) {
            return;
          }

          setPdfDocument(null);

          setPdfDocumentUrl("");

          setErrorMessage(
            error?.message ||
              "PDF를 불러오지 못했습니다.",
          );
        },
      );

    return () => {
      cancelled =
        true;

      loadingTask.destroy();
    };
  }, [
    normalizedPdfUrl,
  ]);

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return undefined;
    }

    const observer =
      new ResizeObserver(
        (entries) => {
          const entry =
            entries[0];

          if (!entry) {
            return;
          }

          setViewportSize({
            width:
              entry.contentRect
                .width,

            height:
              entry.contentRect
                .height,
          });
        },
      );

    observer.observe(
      container,
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      !pdfDocument ||
      pdfDocumentUrl !==
        normalizedPdfUrl ||
      !viewportSize.width ||
      !viewportSize.height
    ) {
      return undefined;
    }

    let cancelled =
      false;

    let renderTask =
      null;

    const safePageNumber =
      clamp(
        Number(
          pageNumber,
        ) || 1,

        1,

        pdfDocument.numPages,
      );

    pdfDocument
      .getPage(
        safePageNumber,
      )
      .then(
        (page) => {
          if (cancelled) {
            return null;
          }

          const baseViewport =
            page.getViewport({
              scale: 1,
            });

          onPageMetrics?.({
            width:
              baseViewport.width,

            height:
              baseViewport.height,
          });

          const fitScale =
            Math.min(
              viewportSize.width /
                baseViewport.width,

              viewportSize.height /
                baseViewport.height,
            );

          const cssScale =
            Math.max(
              0.01,

              fitScale *
                zoom,
            );

          const cssViewport =
            page.getViewport({
              scale:
                cssScale,
            });

          // Supersample small text while keeping large/zoomed pages within
          // a reasonable canvas memory budget (16M pixels, about 64MB).
          const preferredPixelRatio = Math.max(2, window.devicePixelRatio || 1);
          const pixelRatio = Math.min(
            preferredPixelRatio,
            Math.sqrt(16_000_000 / (cssViewport.width * cssViewport.height)),
            8192 / Math.max(cssViewport.width, cssViewport.height),
          );

          const renderViewport =
            page.getViewport({
              scale:
                cssScale *
                pixelRatio,
            });

          const canvas =
            pdfCanvasRef.current;

          if (!canvas) {
            return null;
          }

          canvas.width =
            Math.round(
              renderViewport.width,
            );

          canvas.height =
            Math.round(
              renderViewport.height,
            );

          canvas.style.width =
            `${cssViewport.width}px`;

          canvas.style.height =
            `${cssViewport.height}px`;

          setPageSize({
            width:
              cssViewport.width,

            height:
              cssViewport.height,
          });

          const context =
            canvas.getContext(
              "2d",
            );

          if (!context) {
            return null;
          }

          renderTask =
            page.render({
              canvasContext:
                context,

              viewport:
                renderViewport,
            });

          return (
            renderTask.promise
          );
        },
      )
      .catch(
        (error) => {
          if (
            !cancelled &&
            error?.name !==
              "RenderingCancelledException"
          ) {
            setErrorMessage(
              error?.message ||
                "PDF 페이지를 렌더링하지 못했습니다.",
            );
          }
        },
      );

    return () => {
      cancelled =
        true;

      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [
    pageNumber,
    pdfDocument,
    pdfDocumentUrl,
    normalizedPdfUrl,
    viewportSize.height,
    viewportSize.width,
    zoom,
    onPageMetrics,
  ]);

  return {
    containerRef,
    pdfCanvasRef,

    pageSize,

    normalizedPdfUrl,
    visibleErrorMessage,
  };
}
