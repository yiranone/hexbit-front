// Use the reverse-proxied API in deployed builds; local development can still
// override this with VITE_API_BASE_URL when the backend runs on another port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
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

export type CloudVPC = { id: string; name: string; region_id: string; cidr: string; status: string };
export type CloudSubnet = { id: string; vpc_id: string; name: string; zone_id: string; cidr: string; available_ip: number; status: string };
export type CloudEIP = { id: string; allocation_id: string; address: string; status: string };
export type CloudDisk = { id: string; name: string; category: string; size_gib: number; instance_id?: string; region_id: string; zone_id: string; status: string };
export type CloudSecurityGroup = { id: string; name: string; vpc_id: string; description: string; rule_count: number };
export type CloudOperation = { request_id: string };
export type CloudResourceResult = { id: string; provider_id: string; request_id: string };
export type CloudResourceMapping = { public_id: string; resource_type: string; provider_name: string; provider_account_id?: string; provider_resource_id: string; region_id: string; status: string };
export type AdminAlibabaAccount = {
  id: string; provider: string; name: string; account_id: string; region_id: string; access_key_id: string;
  has_credentials: boolean;
  default_image_id: string; default_vswitch_id: string; default_security_group_id: string;
  status: string; bound_user_count: number; resource_count: number; last_tested_at?: string; last_test_status?: string;
  created_at: string; updated_at: string;
};
export type AdminUser = { id: string; email: string; display_name: string; role: string; status: string; created_at: string };
export type AdminAccountUser = { user_id: string; email: string; display_name: string; role: string; is_default: boolean; created_at: string };
export type AdminAliyunRegion = { id: string; code: string; name: string; status: string; zone_count: number; created_at: string; updated_at: string };
export type AdminAliyunZone = { id: string; region_id: string; region_code: string; region_name: string; zone_code: string; name: string; status: string; created_at: string; updated_at: string };
export type AdminWallet = { user_id: string; email: string; display_name: string; currency: string; balance: number; version: number; updated_at: string };
export type AdminOrder = { order: ApiOrder; user_id: string; email: string; display_name: string };
export type AdminRecharge = { id: string; user_id: string; email: string; display_name: string; kind: string; amount: number; balance_after: number; description: string; created_at: string };

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

function idempotencyHeaders() {
  return { "Idempotency-Key": crypto.randomUUID() };
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
  resetInstancePassword: (id: string, password: string) => request<void>(`/instances/${id}/password`, {
    method: "POST",
    headers: idempotencyHeaders(),
    body: JSON.stringify({ password }),
  }),
  instanceAction: (id: string, action: "start" | "stop" | "restart") => request<void>(`/instances/${id}/actions/${action}`, {
    method: "POST",
    headers: idempotencyHeaders(),
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
  cloudVpcs: () => request<CloudVPC[]>("/cloud/vpcs"),
  createCloudVpc: (input: { region_id?: string; name: string; cidr: string; token?: string; resource_group_id?: string }) => request<CloudResourceResult>("/cloud/vpcs", { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify(input) }),
  deleteCloudVpc: (id: string) => request<CloudOperation>(`/cloud/vpcs/${encodeURIComponent(id)}`, { method: "DELETE" }),
  cloudSubnets: (vpcId: string) => request<CloudSubnet[]>(`/cloud/vpcs/${encodeURIComponent(vpcId)}/subnets`),
  createCloudSubnet: (input: { region_id?: string; vpc_id: string; zone_id: string; name: string; cidr: string; token?: string }) => request<CloudResourceResult>("/cloud/subnets", { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify(input) }),
  deleteCloudSubnet: (id: string) => request<CloudOperation>(`/cloud/subnets/${encodeURIComponent(id)}`, { method: "DELETE" }),
  allocateCloudEip: (input: { region_id?: string; name: string; bandwidth: string; token?: string }) => request<CloudEIP>("/cloud/eips", { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify(input) }),
  cloudEips: () => request<CloudEIP[]>("/cloud/eips"),
  releaseCloudEip: (id: string) => request<CloudOperation>(`/cloud/eips/${encodeURIComponent(id)}/release`, { method: "POST" }),
  associateCloudEip: (id: string, instanceId: string) => request<CloudOperation>(`/cloud/eips/${encodeURIComponent(id)}/associate`, { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify({ instance_id: instanceId }) }),
  unassociateCloudEip: (id: string) => request<CloudOperation>(`/cloud/eips/${encodeURIComponent(id)}/unassociate`, { method: "POST", headers: idempotencyHeaders() }),
  cloudDisks: (instanceId = "") => request<CloudDisk[]>(`/cloud/disks?instance_id=${encodeURIComponent(instanceId)}`),
  createCloudDisk: (input: { region_id?: string; zone_id: string; name: string; category?: string; size_gib: number; token?: string }) => request<CloudResourceResult>("/cloud/disks", { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify(input) }),
  deleteCloudDisk: (id: string) => request<CloudOperation>(`/cloud/disks/${encodeURIComponent(id)}`, { method: "DELETE" }),
  attachCloudDisk: (id: string, instanceId: string) => request<CloudOperation>(`/cloud/disks/${encodeURIComponent(id)}/attach`, { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify({ instance_id: instanceId }) }),
  detachCloudDisk: (id: string, instanceId: string) => request<CloudOperation>(`/cloud/disks/${encodeURIComponent(id)}/detach`, { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify({ instance_id: instanceId }) }),
  cloudSecurityGroups: (vpcId = "") => request<CloudSecurityGroup[]>(`/cloud/security-groups?vpc_id=${encodeURIComponent(vpcId)}`),
  createCloudSecurityGroup: (input: { region_id?: string; vpc_id: string; name: string; description?: string; token?: string }) => request<CloudResourceResult>("/cloud/security-groups", { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify(input) }),
  deleteCloudSecurityGroup: (id: string) => request<CloudOperation>(`/cloud/security-groups/${encodeURIComponent(id)}`, { method: "DELETE" }),
  authorizeCloudSecurityGroup: (id: string, input: { protocol: string; port_range: string; source_cidr: string; policy?: string; token?: string }) => request<CloudOperation>(`/cloud/security-groups/${encodeURIComponent(id)}/rules`, { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify(input) }),
  revokeCloudSecurityGroup: (id: string, input: { protocol: string; port_range: string; source_cidr: string; policy?: string }) => request<CloudOperation>(`/cloud/security-groups/${encodeURIComponent(id)}/rules/revoke`, { method: "POST", headers: idempotencyHeaders(), body: JSON.stringify(input) }),
  cloudResources: (type = "") => request<CloudResourceMapping[]>(`/cloud/resources?type=${encodeURIComponent(type)}`),
  adminUsers: () => request<AdminUser[]>("/admin/users"),
  createAdminUser: (input: { email: string; password: string; display_name: string; role: "member" | "viewer" }) => request<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(input) }),
  updateAdminUser: (id: string, input: { display_name: string; password?: string; role: "member" | "viewer"; status: "active" | "disabled" }) => request<void>(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  disableAdminUser: (id: string) => request<void>(`/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
  adminWallets: (query = "") => request<AdminWallet[]>(`/admin/wallets?q=${encodeURIComponent(query)}`),
  adminOrders: (status = "", query = "") => request<AdminOrder[]>(`/admin/orders?status=${encodeURIComponent(status)}&q=${encodeURIComponent(query)}`),
  adminRecharges: (query = "") => request<AdminRecharge[]>(`/admin/recharges?q=${encodeURIComponent(query)}`),
  adminAliyunRegions: () => request<AdminAliyunRegion[]>("/admin/catalog/regions"),
  createAdminAliyunRegion: (input: { code: string; name: string; status?: string }) => request<AdminAliyunRegion>("/admin/catalog/regions", { method: "POST", body: JSON.stringify(input) }),
  updateAdminAliyunRegion: (id: string, input: { code: string; name: string; status: string }) => request<void>(`/admin/catalog/regions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  disableAdminAliyunRegion: (id: string) => request<void>(`/admin/catalog/regions/${encodeURIComponent(id)}`, { method: "DELETE" }),
  adminAliyunZones: (regionId = "") => request<AdminAliyunZone[]>(`/admin/catalog/zones?region_id=${encodeURIComponent(regionId)}`),
  createAdminAliyunZone: (input: { region_id: string; zone_code: string; name: string; status?: string }) => request<AdminAliyunZone>("/admin/catalog/zones", { method: "POST", body: JSON.stringify(input) }),
  updateAdminAliyunZone: (id: string, input: { region_id: string; zone_code: string; name: string; status: string }) => request<void>(`/admin/catalog/zones/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  disableAdminAliyunZone: (id: string) => request<void>(`/admin/catalog/zones/${encodeURIComponent(id)}`, { method: "DELETE" }),
  adminAlibabaAccounts: () => request<AdminAlibabaAccount[]>("/admin/provider-accounts"),
  createAdminAlibabaAccount: (input: Record<string, unknown>) => request<AdminAlibabaAccount>("/admin/provider-accounts", { method: "POST", body: JSON.stringify(input) }),
  updateAdminAlibabaAccount: (id: string, input: Record<string, unknown>) => request<void>(`/admin/provider-accounts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  disableAdminAlibabaAccount: (id: string) => request<void>(`/admin/provider-accounts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  adminAccountUsers: (id: string) => request<AdminAccountUser[]>(`/admin/provider-accounts/${encodeURIComponent(id)}/users`),
  bindAdminAccountUser: (id: string, userId: string, isDefault: boolean) => request<void>(`/admin/provider-accounts/${encodeURIComponent(id)}/users`, { method: "POST", body: JSON.stringify({ user_id: userId, is_default: isDefault }) }),
  unbindAdminAccountUser: (id: string, userId: string) => request<void>(`/admin/provider-accounts/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}`, { method: "DELETE" }),
  adminProviderResources: (type = "") => request<CloudResourceMapping[]>(`/admin/provider-resources?type=${encodeURIComponent(type)}`),
  associateAdminResource: (resourceType: string, resourceId: string, accountId: string) => request<void>(`/admin/provider-resources/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/associate`, { method: "POST", body: JSON.stringify({ account_id: accountId }) }),
};
