import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQuestion } from "./lectureData.js";
import { findQuestionSlideIndex, getSlideQuestionMarkers } from "./questionNavigation.js";

test("question navigation uses slide identity even when stored page numbers are stale", () => {
  const slides = [{ id: "inserted", pageNumber: 1 }, { id: "original", pageNumber: 2 }];
  const question = normalizeQuestion({ question_id: "q", slide: { slide_id: "original", page_number: 1 } });
  assert.equal(findQuestionSlideIndex(slides, question), 1);
});

test("creating a question preserves its API slide ID and pin coordinates", () => {
  const question = normalizeQuestion({ question_id: "q", slide_id: "s", x_ratio: 0.42, y_ratio: 0.58 });
  assert.equal(findQuestionSlideIndex([{ id: "s" }], question), 0);
  assert.equal(question.xRatio, 0.42);
  assert.equal(question.yRatio, 0.58);
});

test("missing slide IDs never fall back to an unrelated page number", () => {
  const slides = [{ id: "a", pageNumber: 1 }];
  assert.equal(findQuestionSlideIndex(slides, { slide: { slide_id: "gone", page_number: 1 } }), -1);
  assert.equal(findQuestionSlideIndex(slides, { slide: { page_number: 1 } }), -1);
});

test("selected pin is available before page questions load and only on its own slide", () => {
  const selected = normalizeQuestion({ question_id: "q", slide_id: "target", x_ratio: 0.1, y_ratio: 0.2 });
  const stale = normalizeQuestion({ question_id: "old", slide_id: "previous" });
  assert.deepEqual(getSlideQuestionMarkers([stale], selected, "target"), [selected]);
  assert.deepEqual(getSlideQuestionMarkers([], selected, "previous"), []);
  assert.deepEqual(getSlideQuestionMarkers([selected], selected, "target"), [selected]);
});
