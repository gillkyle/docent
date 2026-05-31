export const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    headers:
      init?.body instanceof FormData
        ? undefined
        : { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    const text = await response.text()
    let message = text || response.statusText
    try {
      const data = JSON.parse(text) as { detail?: string }
      message = data.detail || message
    } catch {
      // Non-JSON error body.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
