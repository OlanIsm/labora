"use client";
import { Feedback } from "@/lib/sandbox/feedback";
export default function ActionFeedback({
  feedback,
  message,
  onNext,
}: {
  feedback: Feedback | null;
  message?: string;
  onNext: (next: NonNullable<Feedback["next"]>, target?: string) => void;
}) {
  return (
    <section
      className="sandbox-feedback"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Hasil tindakan"
    >
      {message ? (
        <p>{message}</p>
      ) : feedback ? (
        <>
          <strong>{feedback.title}</strong>
          <p>{feedback.detail}</p>
          <div>
            <small>{feedback.hint}</small>
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
