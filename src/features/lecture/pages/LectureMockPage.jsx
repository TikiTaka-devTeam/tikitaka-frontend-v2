import { useRef, useState } from "react";

import LectureHeader from "../components/LectureHeader.jsx";
import LectureToolbar from "../components/LectureToolbar.jsx";
import DrawingToolOptions from "../components/DrawingToolOptions.jsx";
import PdfSlideStage from "../components/PdfSlideStage.jsx";
import SlidePagination from "../components/SlidePagination.jsx";

import {
  createUuid,
  TOOL_COLORS,
  TOOL_THICKNESS_DEFAULTS,
} from "../utils/lectureData.js";

import "../styles/lecture.css";

const MOCK_PDF_BASE64 =
  "JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyAxMCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgOCAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwOTA4MTMyNzMxKzAwJzAwJykgL0NyZWF0b3IgKGFub255bW91cykgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwOTA4MTMyNzMxKzAwJzAwJykgL0Zyb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKHVuc3BlY2lmaWVkKSAvVGl0bGUgKHVudGl0bGVkKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjggMCBvYmoKPDwKL0NvdW50IDIgL0tpZHMgWyA0IDAgUiA1IDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKOSAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAyMDQKPj4Kc3RyZWFtCkdhcldxOWFcYGsmO0subDpbcCM6MWNmLThgaVoyPyRBLGZSLkIxJ3JVZlAxQ0JkcEl1KSRuLCFHX1dGLjZnXkApP3U3VVQmVnNqJk87JjxTYFJbRm9CPFoyNUNTQ1cjKktgI2c4T0RgQ3BpSUBMMlFwSlFgU1RjOmJdKFd1KCxVY1ZfRyNGPnMmMjpKIzM7Wig1NEJsYG9BdGchITJqODUtKEtIaGVAblhiMGZXJmhML09UJCZHJmU9JyEmYiZFSnRIVyFAIzZAZWN+PmVuZHN0cmVhbQplbmRvYmoKMTAgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMjE0Cj4+CnN0cmVhbQpHYXJXMTVta0lfJ0xfW1lgQFAiQ1JNYWVoPEhNNSwwR2MvMUNNUVhKZFlRTDYvXURsViIxKjRTRGBIO2tdXk9WVUhdP1I0SyskbSlcNz80NWBESyxnKEQqbjQ2ODo/PDR0JSVwNnVvMFMvclUiQFBdSGVJS1FFXGM9UTVLLCNcIjtCS080U0BzMCY6bDUjRUAuJEVkL2peKiYzXl09T15QTl9FSldQa0lRVUtzRGFvUiUmJzktQGBKUWBVVFRXZlNVK09hWWszbiRlR1szKFVPMDBAL34+ZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgMTEKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDYxIDAwMDAwIG4gCjAwMDAwMDAxMDIgMDAwMDAgbiAKMDAwMDAwMDIwOSAwMDAwMCBuIAowMDAwMDAwMzIxIDAwMDAwIG4gCjAwMDAwMDA1MjQgMDAwMDAgbiAKMDAwMDAwMDcyOCAwMDAwMCBuIAowMDAwMDAwNzk2IDAwMDAwIG4gCjAwMDAwMDEwNTcgMDAwMDAgbiAKMDAwMDAwMTEyMiAwMDAwMCBuIAowMDAwMDAxNDE2IDAwMDAwIG4gCnRyYWlsZXIKPDwKL0lEIApbPDlkOWU0MjA0Yzc1ZTY0ODU0ZWQ1ZjQ2Mjc2ZDI1MTgxPjw5ZDllNDIwNGM3NWU2NDg1NGVkNWY0NjI3NmQyNTE4MT5dCiUgUmVwb3J0TGFiIGdlbmVyYXRlZCBQREYgZG9jdW1lbnQgLS0gZGlnZXN0IChvcGVuc291cmNlKQoKL0luZm8gNyAwIFIKL1Jvb3QgNiAwIFIKL1NpemUgMTEKPj4Kc3RhcnR4cmVmCjE3MjEKJSVFT0YK";

const MOCK_PDF_URL =
  `data:application/pdf;base64,${MOCK_PDF_BASE64}`;

const TOTAL_PAGES = 2;

const DRAWING_TOOLS = new Set([
  "PEN",
  "HIGHLIGHTER",
  "ERASER",
]);

const EMPTY_PAGE_STROKES = {
  1: [],
  2: [],
};

const EMPTY_PAGE_HISTORY = {
  1: [],
  2: [],
};

export default function LectureMockPage() {
  const [currentPage, setCurrentPage] =
    useState(1);

  const [activeTool, setActiveTool] =
    useState("PEN");

  const [toolOptionsOpen, setToolOptionsOpen] =
    useState(false);

  const [zoom, setZoom] =
    useState(1);

  const [strokesByPage, setStrokesByPage] =
    useState(EMPTY_PAGE_STROKES);

  const strokesByPageRef =
    useRef(EMPTY_PAGE_STROKES);

  const [undoByPage, setUndoByPage] =
    useState(EMPTY_PAGE_HISTORY);

  const [redoByPage, setRedoByPage] =
    useState(EMPTY_PAGE_HISTORY);

  const [thicknessByTool, setThicknessByTool] =
    useState({
      ...TOOL_THICKNESS_DEFAULTS,
    });

  const [colorByTool, setColorByTool] =
    useState({
      ...TOOL_COLORS,
    });

  const currentStrokes =
    strokesByPage[currentPage] ?? [];

  const currentUndoStack =
    undoByPage[currentPage] ?? [];

  const currentRedoStack =
    redoByPage[currentPage] ?? [];

  const activeThickness =
    thicknessByTool[activeTool] ??
    TOOL_THICKNESS_DEFAULTS.PEN;

  const activeColor =
    colorByTool[activeTool] ??
    "#141B34";

  function updatePageStrokes(page, updater) {
    setStrokesByPage((previous) => {
      const previousPage =
        previous[page] ?? [];

      const nextPage =
        typeof updater === "function"
          ? updater(previousPage)
          : updater;

      const next = {
        ...previous,
        [page]: nextPage,
      };

      strokesByPageRef.current = next;

      return next;
    });
  }

  function pushUndo(page, action) {
    setUndoByPage((previous) => ({
      ...previous,
      [page]: [
        ...(previous[page] ?? []),
        action,
      ],
    }));
  }

  function pushRedo(page, action) {
    setRedoByPage((previous) => ({
      ...previous,
      [page]: [
        ...(previous[page] ?? []),
        action,
      ],
    }));
  }

  function clearRedo(page) {
    setRedoByPage((previous) => ({
      ...previous,
      [page]: [],
    }));
  }

  function handleToolChange(tool) {
    if (DRAWING_TOOLS.has(tool)) {
      if (activeTool === tool) {
        setToolOptionsOpen(
          (previous) => !previous,
        );
      } else {
        setActiveTool(tool);
        setToolOptionsOpen(true);
      }

      return;
    }

    setActiveTool(tool);
    setToolOptionsOpen(false);
  }

  async function handleCreateStroke(stroke) {
    const page = currentPage;

    const savedStroke = {
      ...stroke,
      id: createUuid(),
    };

    updatePageStrokes(page, (previous) => [
      ...previous,
      savedStroke,
    ]);

    pushUndo(page, {
      type: "CREATE",
      strokes: [savedStroke],
    });

    clearRedo(page);

    return savedStroke;
  }

  async function handleEraseStrokes(strokeIds) {
    if (!strokeIds?.length) {
      return [];
    }

    const page = currentPage;

    const pageStrokes =
      strokesByPageRef.current[page] ?? [];

    const removed =
      pageStrokes.filter((stroke) =>
        strokeIds.includes(stroke.id),
      );

    if (!removed.length) {
      return [];
    }

    updatePageStrokes(page, (previous) =>
      previous.filter(
        (stroke) =>
          !strokeIds.includes(stroke.id),
      ),
    );

    pushUndo(page, {
      type: "DELETE",
      strokes: removed,
    });

    clearRedo(page);

    return removed;
  }

  function handleUndo() {
    const page = currentPage;

    const stack =
      undoByPage[page] ?? [];

    const action =
      stack[stack.length - 1];

    if (!action) {
      return;
    }

    setUndoByPage((previous) => ({
      ...previous,
      [page]: (
        previous[page] ?? []
      ).slice(0, -1),
    }));

    if (action.type === "CREATE") {
      const ids =
        action.strokes.map(
          (stroke) => stroke.id,
        );

      updatePageStrokes(page, (previous) =>
        previous.filter(
          (stroke) =>
            !ids.includes(stroke.id),
        ),
      );
    }

    if (action.type === "DELETE") {
      updatePageStrokes(page, (previous) => [
        ...previous,
        ...action.strokes,
      ]);
    }

    pushRedo(page, action);
  }

  function handleRedo() {
    const page = currentPage;

    const stack =
      redoByPage[page] ?? [];

    const action =
      stack[stack.length - 1];

    if (!action) {
      return;
    }

    setRedoByPage((previous) => ({
      ...previous,
      [page]: (
        previous[page] ?? []
      ).slice(0, -1),
    }));

    if (action.type === "CREATE") {
      updatePageStrokes(page, (previous) => [
        ...previous,
        ...action.strokes,
      ]);
    }

    if (action.type === "DELETE") {
      const ids =
        action.strokes.map(
          (stroke) => stroke.id,
        );

      updatePageStrokes(page, (previous) =>
        previous.filter(
          (stroke) =>
            !ids.includes(stroke.id),
        ),
      );
    }

    pushUndo(page, action);
  }

  function moveToPage(page) {
    if (
      page < 1 ||
      page > TOTAL_PAGES
    ) {
      return;
    }

    setCurrentPage(page);
    setToolOptionsOpen(false);
  }

  return (
    <main className="lecture-page lecture-page--student">
      <div className="lecture-frame">
        <LectureHeader
          title="필기 테스트 강의자료"
          spaceName="티키타카 Mock Space"
          canUndo={currentUndoStack.length > 0}
          canRedo={currentRedoStack.length > 0}
          onBack={() => window.history.back()}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDownload={() => {}}
          onMore={() => {}}
        />

        <div className="lecture-workspace">
          <div className="lecture-workspace__main">
            <div className="lecture-toolbar-wrap">
              <LectureToolbar
                role="STUDENT"
                activeTool={activeTool}
                panelOpen={false}
                onToolChange={handleToolChange}
              />

              {toolOptionsOpen && (
                <DrawingToolOptions
                  tool={activeTool}
                  thickness={activeThickness}
                  color={activeColor}
                  onThicknessChange={(value) =>
                    setThicknessByTool(
                      (previous) => ({
                        ...previous,
                        [activeTool]: value,
                      }),
                    )
                  }
                  onColorChange={(value) =>
                    setColorByTool(
                      (previous) => ({
                        ...previous,
                        [activeTool]: value,
                      }),
                    )
                  }
                />
              )}
            </div>

            <PdfSlideStage
              pdfUrl={MOCK_PDF_URL}
              pageNumber={currentPage}
              zoom={zoom}
              activeTool={activeTool}
              thickness={activeThickness}
              color={activeColor}
              privateStrokes={currentStrokes}
              sharedStrokes={[]}
              questions={[]}
              fixers={[]}
              editableLayer="PRIVATE"
              onZoomChange={setZoom}
              onCreateStroke={handleCreateStroke}
              onEraseStrokes={handleEraseStrokes}
              onQuestionPoint={() => {}}
              onFixerPoint={() => {}}
              onQuestionSelect={() => {}}
              onFixerSelect={() => {}}
              fixerDraftPoint={null}
              onFixerDraftCancel={() => {}}
              onFixerDraftSubmit={() => {}}
            />
          </div>
        </div>
      </div>

      <SlidePagination
        currentPage={currentPage}
        totalPages={TOTAL_PAGES}
        onPrevious={() =>
          moveToPage(currentPage - 1)
        }
        onNext={() =>
          moveToPage(currentPage + 1)
        }
      />
    </main>
  );
}