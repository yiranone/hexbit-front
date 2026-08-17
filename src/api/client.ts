const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:18080/api/v1";
const TOKEN_KEY = "hexbit_access_token";
const HTTP_NO_CONTENT = 204;

export type ApiUser = {
  id: string;
  email: string;
  display_name: string;
  role: string;
};

export type ApiOffering = {
  id: string;
  name: string;
  category: "cpu" | "gpu" | "bare_metal";
  region_code: string;
  region: string;
  zone: string;
  cpu_model: string;
  vcpu: number;
  memory_gib: number;
  gpu_model?: string;
  gpu_count: number;
  gpu_memory_gib: number;
  disk_gib: number;
  network_mbps: number;
  price_hourly?: number;
  price_monthly?: number;
  currency: string;
  stock: number;
  status: string;
};

export type ApiWallet = {
  currency: string;
  balance: number;
  version: number;
};

export type ApiResourceGroup = {
  name: string;
  description: string;
};

export type ApiInstance = {
  id: string;
  offering_id: string;
  offering_name: string;
  name: string;
  status: "provisioning" | "running" | "stopped" | "error";
  region: string;
  zone: string;
  spec: string;
  disk_gib: number;
  image: string;
  public_ip: string | null;
  private_ip: string | null;
  billing_mode: "hourly" | "monthly";
  price: number;
  currency: string;
  duration_months?: number;
  auto_renew: boolean;
  vpc: string;
  created_at: string;
  updated_at: string;
};

export type ApiOrder = {
  id: string;
  type: "purchase" | "renewal" | "refund";
  status: "pending_payment" | "processing" | "successful" | "payment_failed" | "creation_failed" | "cancelled";
  resource_type: string;
  resource_name: string;
  offering_id: string;
  offering_name: string;
  region: string;
  zone: string;
  quantity: number;
  billing_mode: "hourly" | "monthly";
  duration: number;
  unit_price: number;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  currency: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  effective_at: string | null;
  finished_at: string | null;
};

export type CreatePurchaseInput = {
  offering_id: string;
  name: string;
  billing_mode: "hourly" | "monthly";
  duration: number;
  quantity: number;
  image?: string;
  vpc?: string;
  private_ip?: string | null;
  auto_renew?: boolean;
  resource_group?: string;
};

export type PaidOrder = { order: ApiOrder; instances: ApiInstance[] };
export type ConsoleSnapshot<T> = { revision: number; state: T; updated_at: string };

type ApiEnvelope<T> = { data: T };
type AuthResult = { access_token: string; token_type: string; expires_in: number; user: ApiUser };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function accessToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(accessToken());
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  const token = accessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | { error?: { code?: string; message?: string } } | null;
  if (!response.ok) {
    const apiError = payload && "error" in payload ? payload.error : undefined;
    throw new ApiError(response.status, apiError?.code ?? "request_failed", apiError?.message ?? "请求失败");
  }
  if (response.status === HTTP_NO_CONTENT) return undefined as T;
  return (payload as ApiEnvelope<T>).data;
}

async function authenticate(path: "/auth/login" | "/auth/register", body: Record<string, string>) {
  const result = await request<AuthResult>(path, { method: "POST", body: JSON.stringify(body) });
  window.localStorage.setItem(TOKEN_KEY, result.access_token);
  return result.user;
}

export const api = {
  login: (email: string, password: string) => authenticate("/auth/login", { email, password }),
  register: (email: string, password: string, displayName: string) =>
    authenticate("/auth/register", { email, password, display_name: displayName }),
  profile: () => request<ApiUser>("/me"),
  offerings: (category: ApiOffering["category"]) => request<ApiOffering[]>(`/offerings?category=${category}`),
  wallet: () => request<ApiWallet>("/wallet"),
  resourceGroups: () => request<ApiResourceGroup[]>("/resource-groups"),
  instances: () => request<ApiInstance[]>("/instances"),
  topUp: (amount: number) => request<ApiWallet>("/wallet/topups", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ amount }),
  }),
  createInstances: (input: CreatePurchaseInput) => request<ApiInstance[]>("/instances", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(input),
  }),
  orders: (status = "", query = "") => request<ApiOrder[]>(`/orders?status=${encodeURIComponent(status)}&q=${encodeURIComponent(query)}`),
  order: (id: string) => request<ApiOrder>(`/orders/${id}`),
  createOrder: (input: CreatePurchaseInput) => request<ApiOrder>("/orders", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(input),
  }),
  payOrder: (id: string) => request<PaidOrder>(`/orders/${id}/pay`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
  }),
  updateInstance: (id: string, input: { name?: string; auto_renew?: boolean }) => request<void>(`/instances/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }),
  instanceAction: (id: string, action: "start" | "stop") => request<void>(`/instances/${id}/actions/${action}`, {
    method: "POST",
  }),
  deleteInstance: (id: string) => request<void>(`/instances/${id}`, { method: "DELETE" }),
  ensureDemoSession: async () => {
    if (!hasAccessToken()) {
      return authenticate("/auth/login", { email: "admin", password: "admin" });
    }
    try {
      return await request<ApiUser>("/me");
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      clearAccessToken();
      return authenticate("/auth/login", { email: "admin", password: "admin" });
    }
  },
  consoleState: <T>() => request<ConsoleSnapshot<T>>("/console/state"),
  saveConsoleState: <T>(revision: number, state: T, operation = "console_state_update") => request<ConsoleSnapshot<T>>("/console/state", {
    method: "PUT",
    body: JSON.stringify({ revision, operation, state }),
  }),
};
