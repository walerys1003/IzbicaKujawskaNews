export interface TraceContext { requestId: string; traceparent?: string }

export const createRequestId = () => crypto.randomUUID()

export const resolveTraceContext = (headers: Headers): TraceContext => ({
  requestId: headers.get('x-request-id') || createRequestId(),
  traceparent: headers.get('traceparent') || undefined,
})
