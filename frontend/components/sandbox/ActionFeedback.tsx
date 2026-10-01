"use client";
import { Feedback } from "@/lib/sandbox/feedback";
export default function ActionFeedback({
  feedback,
  message,
  onNext,
  compact = false,
  condensed = false,
  onDismiss,
}: {
  feedback: Feedback | null;
  message?: string;
  onNext: (next: NonNullable<Feedback["next"]>, target?: string) => void;
  compact?: boolean;
  condensed?: boolean;
  onDismiss?: () => void;
}) {
  if (condensed) return <section className="sandbox-feedback chemistry-feedback" role="status" aria-live="polite" aria-atomic="true" aria-label="Hasil tindakan">
    <p className="chemistry-feedback-text">{message || (feedback ? <><strong>{feedback.title}</strong> {feedback.detail}</> : "Pilih alat untuk mulai. Hasil tindakanmu akan muncul di sini.")}</p>
    {!message && feedback && <>
      <details className="chemistry-feedback-advice"><summary><span>Saran</span><span className="chemistry-advice-text">{feedback.hint}</span></summary></details>
      {feedback.next && <button onClick={() => onNext(feedback.next!, feedback.target)}>{feedback.next === "rack" ? "Buka rak" : feedback.next === "run" ? "Jalankan waktu" : "Lihat hasil"}</button>}
    </>}
    {(message || feedback) && onDismiss && <button aria-label="Tutup feedback" onClick={onDismiss}>Tutup</button>}
  </section>;
  return (
    <section
      className={`sandbox-feedback ${compact ? "sandbox-feedback-compact" : ""} ${!message && !feedback ? "sandbox-feedback-empty" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Hasil tindakan"
    >
      {(feedback || message) && onDismiss && <button className="sandbox-feedback-dismiss" aria-label="Tutup feedback" onClick={onDismiss}>Tutup</button>}
      {message ? (
        <p>{message}</p>
      ) : feedback ? (
        <>
          <strong>{feedback.title}</strong>
          {compact ? (
            <details key={feedback.title + feedback.detail}>
              <summary>Penjelasan</summary>
              <p>{feedback.detail}</p>
              <small>{feedback.hint}</small>
            </details>
          ) : <p>{feedback.detail}</p>}
          <div>
            {!compact && <small>{feedback.hint}</small>}
            {feedback.next && (
              <button onClick={() => onNext(feedback.next!, feedback.target)}>
                {feedback.next === "rack"
                  ? "Buka rak"
                  : feedback.next === "run"
                    ? "Jalankan waktu"
                    : "Lihat hasil"}
              </button>
            )}
          </div>
        </>
      ) : (
        <p>Pilih alat untuk mulai. Hasil tindakanmu akan muncul di sini.</p>
      )}
    </section>
  );
}
