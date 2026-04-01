export class ApiProxy {
  constructor(private baseUrl: string) {}

  async proxyRequest(method: string, url: string, body?: string): Promise<{ ok: boolean; body: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const text = await response.text();
      return { ok: response.ok, body: text };
    } catch (err) {
      return {
        ok: false,
        body: JSON.stringify({ error: String(err) }),
      };
    }
  }

  async handleApiRequest(
    requestId: string,
    method: string,
    url: string,
    body?: string,
  ): Promise<{ requestId: string; ok: boolean; body: string }> {
    const result = await this.proxyRequest(method, url, body);
    return { requestId, ...result };
  }
}
