import LectureViewerPage from "./LectureViewerPage";

export default function StudentLecturePage(
  props,
) {
  return (
    <LectureViewerPage
      {...props}
      role="STUDENT"
    />
  );
}