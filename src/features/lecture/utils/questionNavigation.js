export function getQuestionSlideId(question) {
  return question?.slide?.slide_id ?? question?.slide?.id ?? question?.slide_id ?? question?.slideId ?? null;
}

export function findQuestionSlideIndex(slides, question) {
  const id = getQuestionSlideId(question);
  if (id == null) return -1;
  return slides.findIndex((slide) => String(slide.id) === String(id));
}

export function getSlideQuestionMarkers(questions, selectedQuestion, slideId) {
  const belongsToSlide = (question) => String(getQuestionSlideId(question)) === String(slideId);
  const visible = questions.filter(belongsToSlide);
  if (!selectedQuestion || !belongsToSlide(selectedQuestion)) return visible;
  return [...visible.filter((question) => String(question.id) !== String(selectedQuestion.id)), selectedQuestion];
}
