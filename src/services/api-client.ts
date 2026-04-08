interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = config.headers || {};
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown
  ): Promise<T> {
    const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    const json = await response.json();
    if (json && typeof json === "object" && "success" in json) {
      if (!json.success) {
        throw new Error(json.message || json.reason || "Request failed");
      }
      return json.data as T;
    }

    return json as T;
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>("GET", url);
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>("POST", url, data);
  }

  async patch<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>("PATCH", url, data);
  }

  async delete(url: string): Promise<void> {
    await this.request<void>("DELETE", url);
  }
}

export const apiClient = new ApiClient({
  baseUrl: "",
  headers: {
    "Content-Type": "application/json",
  },
});
