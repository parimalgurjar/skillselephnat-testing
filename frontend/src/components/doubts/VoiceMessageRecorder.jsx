import { useEffect, useRef, useState } from "react";

export default function VoiceMessageRecorder({
  file,
  disabled,
  onFile,
  onBusyChange,
}) {
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const callbacksRef = useRef({ onFile, onBusyChange });
  callbacksRef.current = { onFile, onBusyChange };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);

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
    if (!file?.type?.startsWith("audio/")) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const startRecording = async () => {
    if (disabled || file || phase !== "idle") return;

    setError("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setError(
        "Recording requires a supported browser on HTTPS or localhost."
      );
      return;
    }

    setPhase("starting");
    callbacksRef.current.onBusyChange(true);

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
        clearTimeout(timerRef.current);
        stream.getTracks().forEach((track) => track.stop());

        if (!mountedRef.current) return;

        setPhase("idle");
        setError("Recording failed. Please try again.");
        callbacksRef.current.onBusyChange(false);
      };

      recorder.onstop = () => {
        clearTimeout(timerRef.current);
        stream.getTracks().forEach((track) => track.stop());

        if (!mountedRef.current) return;

        setPhase("idle");
        callbacksRef.current.onBusyChange(false);

        if (failed) return;

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

        callbacksRef.current.onFile(
          new File(
            [blob],
            `voice-${Date.now()}.${extension}`,
            { type }
          )
        );
      };

      recorder.start(1000);
      setPhase("recording");

      timerRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, 180000);
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());

      if (!mountedRef.current) return;

      setPhase("idle");
      callbacksRef.current.onBusyChange(false);

      setError(
        err.name === "NotAllowedError"
          ? "Please allow microphone access in your browser."
          : "Unable to access microphone. Please try again."
      );
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      setPhase("stopping");
      recorder.stop();
    }
  };

  return (
    <div className="se-voice-recorder">
      <button
        type="button"
        className={
          phase === "recording"
            ? "se-voice-button se-voice-stop"
            : "se-voice-button"
        }
        onClick={
          phase === "recording"
            ? stopRecording
            : startRecording
        }
        disabled={
          phase === "recording"
            ? false
            : disabled || Boolean(file) || phase !== "idle"
        }
      >
        {phase === "recording"
          ? "Stop Recording"
          : phase === "starting"
          ? "Opening microphone..."
          : phase === "stopping"
          ? "Preparing audio..."
          : "Record Audio"}
      </button>

      <small aria-live="polite">
        {phase === "recording"
          ? "Recording… Stop when finished. Maximum 3 minutes."
          : file
          ? "Remove the selected attachment to record again."
          : "Record an audio message, preview it, then send."}
      </small>

      {previewUrl && (
        <audio
          key={previewUrl}
          src={previewUrl}
          controls
          preload="metadata"
        />
      )}

      {error && (
        <p className="se-voice-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}