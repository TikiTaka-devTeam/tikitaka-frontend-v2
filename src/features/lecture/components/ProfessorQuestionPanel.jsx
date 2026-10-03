import { useEffect, useRef, useState } from "react";
import SubmitIcon from "../../../assets/icons/submit.svg";
import SubmitActiveIcon from "../../../assets/icons/submit-professor-active.svg";
import MoreIcon from "../../../assets/icons/professor-answer-more.svg";
import EditIcon from "../../../assets/icons/professor-answer-edit.svg";
import RecordStartIcon from "../../../assets/icons/professor-record-start.svg";
import RecordStopIcon from "../../../assets/icons/professor-record-stop.svg";
import "../styles/professor-question-panel.css";

function AnswerView({ question, initialMode, renderList, questions, questionScope, onQuestionScopeChange, onArchive, onBack, onSubmitAnswer, onSubmitVoice }) {
  const answer = question.answers?.[0];
  const [editing, setEditing] = useState(!answer);
  const [content, setContent] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const waveformRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const aliveRef = useRef(true);
  const mode = answer?.answer_type ?? initialMode;

  function stopWaveform() {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") void audioContext.close();
  }

  function startWaveform(stream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const canvas = waveformRef.current;
    if (!AudioContextClass || !canvas) return;

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);
    const frequencies = new Uint8Array(analyser.frequencyBinCount);
    const context = canvas.getContext("2d");
    if (!context) { stopWaveform(); return; }

    function drawWaveform() {
      analyser.getByteFrequencyData(frequencies);
      const displayedWidth = Math.round(canvas.getBoundingClientRect().width);
      if (displayedWidth && canvas.width !== displayedWidth) canvas.width = displayedWidth;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#E24B63";
      context.lineWidth = 1;
      const barCount = Math.ceil(canvas.width / 2);
      const step = 2;
      context.beginPath();
      for (let index = 0; index < barCount; index += 1) {
        const frequency = frequencies[Math.min(frequencies.length - 1, 2 + index)] / 255;
        const height = Math.max(2, Math.min(canvas.height - 2, frequency * canvas.height * 1.8));
        const x = Math.round(index * step) + 0.5;
        context.moveTo(x, (canvas.height - height) / 2);
        context.lineTo(x, (canvas.height + height) / 2);
      }
      context.stroke();
      animationFrameRef.current = window.requestAnimationFrame(drawWaveform);
    }

    void audioContext.resume().catch(() => {
      if (aliveRef.current) setError("마이크 입력 파형을 표시할 수 없습니다.");
    });
    drawWaveform();
  }

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      stopWaveform();
    };
  }, []);

  async function submitText(event) {
    event.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await onSubmitAnswer({ answer, content: content.trim() });
      if (aliveRef.current) { setEditing(false); setContent(""); }
    } catch (failure) {
      if (aliveRef.current) setError(failure?.response?.data?.message ?? "답변을 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      setRecording(false);
      setBusy(true);
      recorderRef.current?.stop();
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined" ||
          !MediaRecorder.isTypeSupported("audio/webm")) {
        throw new Error("이 브라우저에서는 음성 녹음을 지원하지 않습니다. 텍스트 답변을 이용해주세요.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!aliveRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => {
        recorder.onstop = null;
        stream.getTracks().forEach((track) => track.stop());
        stopWaveform();
        if (aliveRef.current) { setRecording(false); setBusy(false); setError("녹음에 실패했습니다. 다시 시도해주세요."); }
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        stopWaveform();
        if (!aliveRef.current) return;
        try {
          const file = new File(chunks, "answer.webm", { type: "audio/webm" });
          if (!file.size) throw new Error("녹음된 음성이 없습니다. 다시 녹음해주세요.");
          await onSubmitVoice(file, question.id);
          if (aliveRef.current) setEditing(false);
        } catch (failure) {
          if (aliveRef.current) setError(failure?.response?.data?.message ?? failure.message ?? "음성 답변을 저장하지 못했습니다.");
        } finally {
          if (aliveRef.current) { setBusy(false); setRecording(false); }
        }
      };
      recorder.start();
      setRecording(true);
      try { startWaveform(stream); } catch {
        stopWaveform();
        setError("마이크 입력 파형을 표시할 수 없습니다.");
      }
    } catch (failure) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      stopWaveform();
      if (aliveRef.current) setError(failure.name === "NotAllowedError" ? "마이크 사용 권한을 허용해주세요." : failure.message);
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }

  if (answer) {
    return <>
      <div className="question-panel__header">
        <div className="question-panel__header-copy"><h2>질문 리스트</h2><p>{questionScope === "SLIDE" ? "해당 페이지" : "전체"}</p></div>
        <div className="question-panel__header-actions"><button type="button" className="question-panel__archive" onClick={onArchive}>질문 아카이브</button></div>
      </div>
      <div className="question-panel__scope-row">{[["SLIDE", "해당페이지"], ["DOCUMENT", "전체"]].map(([value, label]) => <button key={value} type="button" className={`question-panel__scope-button${questionScope === value ? " is-active" : ""}`} aria-pressed={questionScope === value} onClick={() => onQuestionScopeChange(value)}>{label}</button>)}</div>
      <div className="question-panel__scroll">
        {renderList(questions)}
        <div className="question-panel__divider" />
        <section className="question-panel__answer-section">
          <div className="professor-question-panel__answer-heading">
            <h3 className="question-panel__answer-heading">답변</h3>
            <button type="button" className="professor-question-panel__more" aria-label="답변 메뉴" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><img src={MoreIcon} alt="" /></button>
            {menuOpen && <button type="button" className="professor-question-panel__edit-menu" onClick={() => { setEditing(true); setContent(answer.content ?? ""); setMenuOpen(false); }}><img src={EditIcon} alt="" />수정</button>}
          </div>
          {!editing ? <div className="question-panel__answer-readonly"><p>{answer.content}</p></div> : <form className="professor-question-panel__input professor-question-panel__input--inline" onSubmit={submitText}>
            <textarea aria-label="답변 수정" placeholder="수정사항 입력" value={content} disabled={busy} onChange={(event) => setContent(event.target.value)} />
            <button type="submit" aria-label="수정 저장" disabled={busy || !content.trim()}><img src={!busy && content.trim() ? SubmitActiveIcon : SubmitIcon} alt="" /></button>
          </form>}
          {error && <p className="professor-question-panel__error" role="alert">{error}</p>}
        </section>
      </div>
    </>;
  }

  return <>
    <div className="question-panel__header">
      <div className="question-panel__header-copy"><h2>질문 답변</h2><p>{mode === "VOICE" ? "음성답변" : "텍스트 답변"}</p></div>
      <div className="question-panel__header-actions"><button type="button" className="professor-question-panel__back" onClick={onBack} disabled={busy}>뒤로가기</button></div>
    </div>
    <div className="professor-question-panel__selected">{renderList([question])}</div>
    <p className="professor-question-panel__placeholder" role="status">{recording ? "답변 중" : busy ? "답변을 정리하고 있습니다" : "답변을 입력해주세요"}</p>
    {error && <p className="professor-question-panel__error" role="alert">{error}</p>}
    {editing && (mode === "TEXT" || answer ?
      <form className="professor-question-panel__input" onSubmit={submitText}>
        <textarea aria-label={answer ? "답변 수정" : "답변 입력"} placeholder={answer ? "수정사항 입력" : "답변 입력"} value={content} disabled={busy} onChange={(event) => setContent(event.target.value)} />
        <button type="submit" aria-label={answer ? "수정 저장" : "답변 등록"} disabled={busy || !content.trim()}><img src={!busy && content.trim() ? SubmitActiveIcon : SubmitIcon} alt="" /></button>
      </form> :
      <div className="professor-question-panel__recorder">
        <button type="button" aria-label={recording ? "녹음 정지 및 답변 등록" : "음성 녹음 시작"} disabled={busy || !onSubmitVoice} onClick={toggleRecording}><img src={recording ? RecordStopIcon : RecordStartIcon} alt="" /></button>
        <canvas ref={waveformRef} className="professor-question-panel__waveform" width="240" height="24" role="img" aria-label="마이크 입력 파형" hidden={!recording} />
      </div>
    )}
  </>;
}

export default function ProfessorQuestionPanel({ selectedQuestion, questions, questionScope, loading, onQuestionScopeChange, onSubmitAnswer, onSubmitVoice, onArchive, renderList }) {
  const [mode, setMode] = useState(null);
  const [selectionId, setSelectionId] = useState(selectedQuestion?.id);
  if (selectionId !== selectedQuestion?.id) { setSelectionId(selectedQuestion?.id); setMode(null); }
  const answerMode = mode ?? (selectedQuestion?.answers?.[0] ? selectedQuestion.answers[0].answer_type ?? "TEXT" : null);
  return <aside className="question-panel question-panel--list professor-question-panel" data-answer-mode={answerMode || undefined}>
    {answerMode && selectedQuestion ? <AnswerView key={`${selectedQuestion.id}:${answerMode}`} question={selectedQuestion} initialMode={answerMode} questions={questions} questionScope={questionScope} onQuestionScopeChange={onQuestionScopeChange} onArchive={onArchive} onBack={() => setMode(null)} renderList={renderList} onSubmitAnswer={onSubmitAnswer} onSubmitVoice={onSubmitVoice} /> : <>
      <div className="question-panel__header">
        <div className="question-panel__header-copy"><h2>질문 리스트</h2><p>{questionScope === "SLIDE" ? "해당 페이지" : "전체"}</p></div>
        <div className="question-panel__header-actions">
          <button type="button" className="question-panel__archive" onClick={onArchive}>질문 아카이브</button>
        </div>
      </div>
      <div className="question-panel__scope-row">{[["SLIDE", "해당페이지"], ["DOCUMENT", "전체"]].map(([value, label]) => <button key={value} type="button" className={`question-panel__scope-button${questionScope === value ? " is-active" : ""}`} aria-pressed={questionScope === value} onClick={() => onQuestionScopeChange(value)}>{label}</button>)}</div>
      <div className="professor-question-panel__questions">{loading ? <p className="question-panel__empty">불러오는 중...</p> : renderList(questions)}</div>
      {selectedQuestion && <div className="professor-question-panel__actions"><strong>질문 답변하기</strong><button type="button" onClick={() => setMode("TEXT")}>텍스트답변</button><button type="button" onClick={() => setMode("VOICE")}>음성답변</button></div>}
    </>}
  </aside>;
}
