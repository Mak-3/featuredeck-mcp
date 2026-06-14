export class FeaturedeckApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "FeaturedeckApiError";
  }
}

export interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

export class FeaturedeckClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(
      path.startsWith("/") ? path : `/${path}`,
      `${this.baseUrl}/`
    );
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  async request<T = unknown>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = "GET", query, body } = options;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      response = await fetch(this.buildUrl(path, query), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new FeaturedeckApiError(
        `Could not reach Featuredeck API at ${this.baseUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`,
        0
      );
    }

    const text = await response.text();
    let parsed: unknown = undefined;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      let message = `Featuredeck API request failed (${response.status})`;
      if (
        parsed &&
        typeof parsed === "object" &&
        "error" in parsed &&
        typeof (parsed as { error: unknown }).error === "string"
      ) {
        message = (parsed as { error: string }).error;
      }
      throw new FeaturedeckApiError(message, response.status, parsed);
    }

    return parsed as T;
  }
}
