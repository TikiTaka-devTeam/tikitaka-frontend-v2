import LectureViewerPage from "./LectureViewerPage";

export default function ProfessorLecturePage(
  props,
) {
  return (
    <LectureViewerPage
      {...props}
      role="PROFESSOR"
    />
  );
}