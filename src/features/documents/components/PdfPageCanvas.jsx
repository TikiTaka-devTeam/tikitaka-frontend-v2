import { useEffect, useRef, useState } from "react";

const thumbnailCanvasCache = new WeakMap();
const MAX_CACHED_THUMBNAILS_PER_DOCUMENT = 120;

function getThumbnailCache(pdfDocument) {
  let cache = thumbnailCanvasCache.get(pdfDocument);

  if (!cache) {
    cache = new Map();
    thumbnailCanvasCache.set(pdfDocument, cache);
  }

  return cache;
}

function displayRenderedCanvas(targetCanvas, renderedCanvas, cssWidth, cssHeight) {
  targetCanvas.width = renderedCanvas.width;
  targetCanvas.height = renderedCanvas.height;
  targetCanvas.style.width = `${cssWidth}px`;
  targetCanvas.style.height = `${cssHeight}px`;
  targetCanvas.getContext("2d")?.drawImage(renderedCanvas, 0, 0);
}

function PdfPageCanvas({
  cacheRenderedPage = false,
  className = "",
  emptyMessage = "PDF 페이지를 불러오는 중입니다.",
  pageNumber,
  pdfDocument,
  zoom = 1,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const hasRenderedPageRef = useRef(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return undefined;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };
    const observer = new ResizeObserver(updateSize);

    updateSize();
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      !pdfDocument ||
      !containerSize.width ||
      !containerSize.height
    ) {
      return undefined;
    }

    let cancelled = false;
    let renderTask;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);

        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = Math.min(
          containerSize.width / baseViewport.width,
          containerSize.height / baseViewport.height,
        );
        const zoomedScale = fitScale * zoom;
        const cssViewport = page.getViewport({ scale: zoomedScale });
        const pixelRatio = window.devicePixelRatio || 1;
        const renderViewport = page.getViewport({ scale: zoomedScale * pixelRatio });
        const canvas = canvasRef.current;

        if (!canvas) return;

        const cache = cacheRenderedPage ? getThumbnailCache(pdfDocument) : null;
        const cacheKey = `${pageNumber}:${containerSize.width}:${containerSize.height}:${zoom}:${pixelRatio}`;
        const cachedCanvas = cache?.get(cacheKey);

        if (cachedCanvas) {
          cache.delete(cacheKey);
          cache.set(cacheKey, cachedCanvas);
          displayRenderedCanvas(
            canvas,
            cachedCanvas,
            cssViewport.width,
            cssViewport.height,
          );
          hasRenderedPageRef.current = true;
          setRenderError("");
          return;
        }

        const renderCanvas = document.createElement("canvas");
        renderCanvas.width = Math.round(renderViewport.width);
        renderCanvas.height = Math.round(renderViewport.height);

        const context = renderCanvas.getContext("2d");

        if (!context) throw new Error("PDF canvas context를 생성하지 못했습니다.");

        renderTask = page.render({
          canvasContext: context,
          viewport: renderViewport,
        });
        await renderTask.promise;

        if (!cancelled) {
          displayRenderedCanvas(
            canvas,
            renderCanvas,
            cssViewport.width,
            cssViewport.height,
          );
          hasRenderedPageRef.current = true;

          if (cache) {
            cache.set(cacheKey, renderCanvas);
            if (cache.size > MAX_CACHED_THUMBNAILS_PER_DOCUMENT) {
              cache.delete(cache.keys().next().value);
            }
          }

          setRenderError("");
        }
      } catch (error) {
        if (!cancelled && error?.name !== "RenderingCancelledException") {
          setRenderError("PDF 페이지를 렌더링하지 못했습니다.");
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [cacheRenderedPage, containerSize.height, containerSize.width, pageNumber, pdfDocument, zoom]);

  const statusMessage = renderError
    || (!pdfDocument && !hasRenderedPageRef.current ? emptyMessage : "");

  return (
    <div
      ref={containerRef}
      className={`document-modify-pdf-page ${className}`.trim()}
    >
      <canvas
        ref={canvasRef}
        aria-label={`${pageNumber}페이지 PDF`}
        className={statusMessage ? "is-hidden" : undefined}
        role="img"
      />
      {statusMessage && (
        <span className="document-modify-pdf-page__status" role="status">
          {statusMessage}
        </span>
      )}
    </div>
  );
}

export default PdfPageCanvas;
