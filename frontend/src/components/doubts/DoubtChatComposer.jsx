import { useEffect, useRef, useState } from "react";
import {
  Paperclip,
  Mic,
  Send,
  Square,
  Trash2,
  X,
  FileText,
  LoaderCircle,
} from "lucide-react";
import styles from "./DoubtChatComposer.module.css";

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function DoubtChatComposer({
  value,
  onChange,
  file,
  onFileChange,
  onSubmit,
  sending = false,
  disabled = false,
  onBusyChange,
}) {
  const [phase, setPhase] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const discardRef = useRef(false);
  const phaseRef = useRef("idle");

  const callbacksRef = useRef({
    onFileChange,
    onBusyChange,
  });

  useEffect(() => {
  callbacksRef.current = {
    onFileChange,
    onBusyChange,
  };
}, [onFileChange, onBusyChange]);

  const locked = sending || disabled;
  const busy = phase !== "idle";
  const hasContent = Boolean(value.trim() || file);
  const isAudio = Boolean(file?.type?.startsWith("audio/"));
  const isImage = Boolean(file?.type?.startsWith("image/"));

  const changePhase = (nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    callbacksRef.current.onBusyChange?.(nextPhase !== "idle");
  };

  const clearTimers = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      discardRef.current = true;

      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);

      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height =
      `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  const startRecording = async () => {
    if (locked || file || phaseRef.current !== "idle") return;

    setError("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setError("Use HTTPS or localhost to record audio.");
      return;
    }

    changePhase("starting");
    discardRef.current = false;

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      recorderRef.current = recorder;

      const chunks = [];
      let failed = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        failed = true;
        clearTimers();

        stream.getTracks().forEach((track) => track.stop());

        if (!mountedRef.current) return;

        changePhase("idle");
        setError("Recording failed. Please try again.");
      };

      recorder.onstop = () => {
        clearTimers();

        stream.getTracks().forEach((track) => track.stop());

        if (!mountedRef.current) return;

        changePhase("idle");

        if (failed || discardRef.current) return;

        const type = (
          recorder.mimeType ||
          chunks[0]?.type ||
          "audio/webm"
        ).split(";")[0];

        const blob = new Blob(chunks, { type });

        if (!blob.size) {
          setError("No audio recorded. Please try again.");
          return;
        }

        if (blob.size > 20 * 1024 * 1024) {
          setError("Audio must be smaller than 20 MB.");
          return;
        }

        const extension = type.includes("mp4")
          ? "m4a"
          : type.includes("ogg")
          ? "ogg"
          : "webm";

        callbacksRef.current.onFileChange(
          new File(
            [blob],
            `voice-${Date.now()}.${extension}`,
            { type }
          )
        );
      };

      recorder.start(1000);
      setSeconds(0);
      changePhase("recording");

      const startedAt = Date.now();

      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          setSeconds(
            Math.floor((Date.now() - startedAt) / 1000)
          );
        }
      }, 250);

      timeoutRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") {
          changePhase("stopping");
          recorder.stop();
        }
      }, 180000);
    } catch (err) {
      clearTimers();
      stream?.getTracks().forEach((track) => track.stop());

      if (!mountedRef.current) return;

      changePhase("idle");

      setError(
        err.name === "NotAllowedError"
          ? "Allow microphone access in your browser."
          : "Cannot access microphone. Please try again."
      );
    }
  };

  const stopRecording = (discard = false) => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") return;

    discardRef.current = discard;
    changePhase("stopping");
    recorder.stop();
  };

  const handleSubmit = (event) => {
    if (
      locked ||
      phaseRef.current !== "idle" ||
      !hasContent
    ) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  };

  return (
    <form
      className={styles.composer}
      onSubmit={handleSubmit}
      aria-label="Chat message composer"
    >
      {file && (
        <div className={styles.preview}>
          {isImage && preview ? (
            <img
              className={styles.thumbnail}
              src={preview}
              alt="Selected attachment"
            />
          ) : (
            <div className={styles.fileIcon}>
              {isAudio ? <Mic size={20} /> : <FileText size={20} />}
            </div>
          )}

          <div className={styles.fileDetails}>
            <strong>{isAudio ? "Audio message" : file.name}</strong>

            {isAudio && preview ? (
              <audio
                key={preview}
                src={preview}
                controls
                preload="metadata"
                className={styles.audioPreview}
              />
            ) : (
              <small>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </small>
            )}
          </div>

          <button
            type="button"
            className={styles.iconButton}
            title="Remove attachment"
            aria-label="Remove attachment"
            disabled={locked || busy}
            onClick={() => {
              onFileChange(null);
              setError("");
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className={styles.bar}>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          disabled={locked || busy}
          onChange={(event) => {
            const selected = event.target.files?.[0];

            if (selected) {
              onFileChange(selected);
              setError("");
            }

            event.target.value = "";
          }}
        />

        {busy ? (
          <>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.deleteButton}`}
              title="Discard recording"
              aria-label="Discard recording"
              disabled={phase !== "recording"}
              onClick={() => stopRecording(true)}
            >
              <Trash2 size={20} />
            </button>

            <div
              className={styles.recording}
              role="status"
              aria-live="polite"
            >
              <span className={styles.recordDot} />
              <span>
                {phase === "starting"
                  ? "Opening microphone…"
                  : phase === "stopping"
                  ? "Preparing audio…"
                  : "Recording"}
              </span>

              {phase === "recording" && (
                <strong>{formatTime(seconds)}</strong>
              )}
            </div>

            <button
              type="button"
              className={`${styles.actionButton} ${styles.stopButton}`}
              title="Stop and preview"
              aria-label="Stop and preview recording"
              disabled={phase !== "recording"}
              onClick={() => stopRecording(false)}
            >
              {phase === "recording" ? (
                <Square size={18} fill="currentColor" />
              ) : (
                <LoaderCircle
                  size={20}
                  className={styles.spinner}
                />
              )}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.iconButton}
              title="Attach file"
              aria-label="Attach file"
              disabled={locked}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={22} />
            </button>

            <textarea
              ref={textareaRef}
              className={styles.textInput}
              rows={1}
              value={value}
              placeholder="Type a message..."
              aria-label="Message"
              disabled={locked}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />

            {hasContent || sending ? (
              <button
                type="submit"
                className={styles.actionButton}
                title="Send message"
                aria-label="Send message"
                disabled={locked}
              >
                {sending ? (
                  <LoaderCircle
                    size={21}
                    className={styles.spinner}
                  />
                ) : (
                  <Send size={20} />
                )}
              </button>
            ) : (
              <button
                type="button"
                className={styles.actionButton}
                title="Record audio"
                aria-label="Record audio"
                disabled={locked}
                onClick={startRecording}
              >
                <Mic size={22} />
              </button>
            )}
          </>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}