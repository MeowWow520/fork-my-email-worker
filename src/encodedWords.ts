export function decodeEncodedWords(input: string): string {
  const encodedWord = '=\\?[^?\\r\\n]+\\?[BbQq]\\?[^?\\r\\n]*\\?='
  const normalized = input.replace(
    new RegExp(`${encodedWord}(?:\\s+${encodedWord})*`, 'g'),
    (m) => m.replace(/\s+/g, '')
  )
  return normalized.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (_whole, charset: string, encoding: string, payload: string) => {
      try {
        const bytes =
          encoding.toUpperCase() === 'B'
            ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
            : Uint8Array.from(
                payload
                  .replace(/_/g, ' ')
                  .replace(/=([0-9A-Fa-f]{2})/g, (_s, hex: string) =>
                    String.fromCharCode(parseInt(hex, 16))
                  ),
                (c) => c.charCodeAt(0)
              )
        return new TextDecoder(charset).decode(bytes)
      } catch {
        return _whole
      }
    }
  )
}
