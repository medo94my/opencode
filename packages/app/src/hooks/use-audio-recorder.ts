import { createSignal, onCleanup } from "solid-js"
import { checkMicrophonePermission } from "@/utils/transcribe"

export type RecordingState = "idle" | "recording" | "transcribing"

export function useAudioRecorder() {
  const [state, setState] = createSignal<RecordingState>("idle")
  const [error, setError] = createSignal<string | null>(null)
  const [duration, setDuration] = createSignal(0)
  const [audioBlob, setAudioBlob] = createSignal<Blob | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let chunks: Blob[] = []
  let durationInterval: ReturnType<typeof setInterval> | undefined
  let startTime = 0
  let abortController: AbortController | null = null

  const supported = () => isSupported()

  function isSupported() {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined"
  }

  function pickMimeType(): string {
    if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return ""
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/aac"]
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t
    }
    return ""
  }

  async function start() {
    try {
      setError(null)
      setDuration(0)
      chunks = []
      setAudioBlob(null)
      abortController = new AbortController()

      const perm = await checkMicrophonePermission()
      if (perm === "denied") {
        throw new Error("Microphone access denied. Please enable it in your browser settings.")
      }

      stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = pickMimeType()

      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const type = mimeType || "audio/webm"
        const blob = new Blob(chunks, { type })
        setAudioBlob(blob)
        if (stream) {
          stream.getTracks().forEach((t) => t.stop())
          stream = null
        }
        clearInterval(durationInterval)
      }

      mediaRecorder.onerror = () => {
        setError("Recording failed")
        setState("idle")
        cleanup()
      }

      mediaRecorder.start(100)
      startTime = Date.now()
      setState("recording")

      durationInterval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 200)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Microphone access denied"
      setError(msg)
      setState("idle")
      cleanup()
    }
  }

  function stop() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
      setState("transcribing")
    }
  }

  function getAbortSignal(): AbortSignal | undefined {
    return abortController?.signal
  }

  function cleanup() {
    clearInterval(durationInterval)
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }
    mediaRecorder = null
  }

  function reset() {
    setAudioBlob(null)
    setError(null)
    setDuration(0)
    setState("idle")
    abortController = null
  }

  onCleanup(cleanup)

  return {
    state,
    error,
    duration,
    audioBlob,
    supported,
    start,
    stop,
    getAbortSignal,
    reset,
  }
}
