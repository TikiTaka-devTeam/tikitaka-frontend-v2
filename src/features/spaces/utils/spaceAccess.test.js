import test from "node:test";
import assert from "node:assert/strict";
import { findSpaceAccess, isSpaceMutation } from "./spaceAccess.js";

test("archived Space wins over a stale active-list response", () => {
  const active = { spaces: [{ space_id: "space", status: "ACTIVE" }] };
  const archived = { spaces: [{ space_id: "space", status: "ARCHIVED", space_name: "Lecture" }] };
  assert.deepEqual(findSpaceAccess("space", active, archived), { status: "ARCHIVED", name: "Lecture" });
});

test("restored Space becomes active; pending or unknown membership grants no access", () => {
  assert.equal(findSpaceAccess("space", { spaces: [{ space_id: "space", status: "ACTIVE" }] }, { spaces: [] }).status, "ACTIVE");
  assert.throws(() => findSpaceAccess("space", { spaces: [], pending_spaces: [{ space_id: "space" }] }, { spaces: [] }));
  assert.throws(() => findSpaceAccess("space", { spaces: [{ space_id: "other", status: "ACTIVE" }] }, { spaces: [] }));
});

test("read-only Space allows all existing lookup and download requests", () => {
  for (const url of ["/spaces/space/documents", "/documents/pdf/download?note_type=ALL", "/slides/page/private-strokes", "/questions/question", "/notices/notice", "/assignments/task/submissions/download", "/assignments/task/submissions/me", "/spaces/space/members"]) {
    assert.equal(isSpaceMutation({ method: "GET", url }, "space"), false, url);
  }
});

test("read-only Space blocks every supported resource mutation including direct editing", () => {
  const requests = [
    ["post", "/spaces/space/documents"], ["delete", "/documents/pdf"],
    ["post", "/documents/pdf/revisions"], ["post", "/slides/page/private-strokes/sync"],
    ["post", "/slides/page/shared-strokes/sync"], ["post", "/slides/page/questions"],
    ["post", "/questions/question/answers"], ["patch", "/answers/answer"],
    ["post", "/questions/question/comments"], ["patch", "/comments/comment"],
    ["delete", "/comments/comment"], ["post", "/questions/question/like"],
    ["delete", "/questions/question/like"], ["post", "/spaces/space/notices"],
    ["patch", "/notices/notice"], ["post", "/assignments/task/submissions"],
    ["put", "/assignments/task/submissions/me"], ["put", "/assignments/task/grades"],
    ["post", "/assignments/task/grades/finalize"], ["post", "/slides/page/fixers"],
    ["patch", "/fixers/fixer/check"], ["patch", "/categories/category"],
    ["put", "/spaces/space/members/member/role-permissions"],
    ["patch", "/spaces/space/join-requests/approve"], ["delete", "/spaces/space"],
  ];
  for (const [method, url] of requests) assert.equal(isSpaceMutation({ method, url }, "space"), true, `${method} ${url}`);
});

test("only restoring the current Space is allowed; unrelated account actions remain available", () => {
  assert.equal(isSpaceMutation({ method: "patch", url: "/spaces/space/restore" }, "space"), false);
  assert.equal(isSpaceMutation({ method: "patch", url: "/spaces/other/restore" }, "space"), true);
  assert.equal(isSpaceMutation({ method: "delete", url: "/spaces/space/restore" }, "space"), true);
  assert.equal(isSpaceMutation({ method: "post", url: "/auth/token/refresh" }, "space"), false);
  assert.equal(isSpaceMutation({ method: "patch", url: "/users/me/profile-image" }, "space"), false);
  assert.equal(isSpaceMutation({ method: "patch", url: "/notifications/notification/read" }, "space"), false);
  assert.equal(isSpaceMutation({ method: "post", url: "https://api.example.com/api/v1/slides/page/shared-strokes/sync" }, "space"), true);
});
