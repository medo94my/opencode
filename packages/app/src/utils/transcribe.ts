const STT_API_URL =
  (typeof import.meta !== "undefined" && (import.meta as Record<string, any>).env?.VITE_STT_API_URL) ||
  "http://localhost:8086/v1/audio/transcriptions"
const STT_MODEL = "Parakeet-TDT-0.6B-v3"

export async function transcribeAudio(audioBlob: Blob, signal?: AbortSignal): Promise<string> {
  const formData = new FormData()
  formData.append("file", audioBlob, "recording.webm")
  formData.append("model", STT_MODEL)
  formData.append("response_format", "json")

  const res = await fetch(STT_API_URL, {
    method: "POST",
    body: formData,
    signal,
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown error")
    throw new Error(`STT failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.text ?? ""
}

export async function checkMicrophonePermission(): Promise<"granted" | "denied" | "prompt"> {
  try {
    const perm = await navigator.permissions.query({ name: "microphone" as PermissionName })
    return perm.state
  } catch {
    return "prompt"
  }
}

export function isSpeechSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined"
}
