/**
 * Minimal stand-in for the mxtape API in tests: /api/data/{kind} with the
 * server's versioning (409 + current document on a stale write).
 */
type Doc = { version: number; data: unknown }

let docs: Record<string, Doc> = {}

export function resetFakeApi() {
  docs = {}
}

export function fakeDoc(kind: string): Doc {
  return docs[kind] ?? { version: 0, data: null }
}

export function seedFakeDoc(kind: string, data: unknown, version = 1) {
  docs[kind] = { version, data }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export async function fakeApiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
  const method = (init.method ?? 'GET').toUpperCase()
  const match = /^\/api\/data\/(\w+)$/.exec(url)
  if (match) {
    const kind = match[1]
    if (method === 'GET') return json(200, fakeDoc(kind))
    if (method === 'PUT') {
      const body = JSON.parse(String(init.body)) as Doc
      const current = fakeDoc(kind)
      if (body.version !== current.version) return json(409, { code: 'conflict', message: 'stale', current })
      docs[kind] = { version: current.version + 1, data: body.data }
      return json(200, docs[kind])
    }
  }
  if (url === '/api/data' && method === 'DELETE') {
    resetFakeApi()
    return json(200, { ok: true })
  }
  return json(404, { code: 'not_found', message: `no fake for ${method} ${url}` })
}
