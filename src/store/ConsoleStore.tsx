import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AlertRule, ApiKey, ConsoleState, ConsoleUser, Disk, Instance, InstanceDraft, PublicIp, ResourceGroup, SecurityGroup, Tag, Vpc } from "../domain";
import { api, ApiError, type AdminProviderSyncResource, type ApiInstance, type ApiOrder, type ApiUser, type CloudDisk, type CloudEIP, type CloudSecurityGroup, type CloudSubnet, type CloudVPC } from "../api";

const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`;

const seed: ConsoleState = {
  version: 5, selectedRegion: "", balance: 0, instances: [], orders: [], vpcs: [], subnets: [],
  securityGroups: [], disks: [], resourceGroups: [], tags: [], users: [], apiKeys: [], alertRules: [],
  alertEvents: [], billing: [], logs: [], publicIps: [], notifications: [], authorizations: [],
  quotaRequests: [], supportTickets: [],
};

function mapRemoteInstance(item: ApiInstance): Instance {
  const status = item.status === "provisioning" ? "creating" : item.status;
  const cpu = Number(item.spec.match(/(\d+)\s*(?:C|vCPU|核)/i)?.[1] ?? item.spec.match(/^(\d+)/)?.[1] ?? 0);
  const memory = Number(item.spec.match(/(\d+)\s*(?:G|GiB|GB)/i)?.[1] ?? 0);
  return {
    id: item.id, offeringId: item.offering_id, name: item.name, status, region: item.region, zone: item.zone, cpu,
    memory, gpu: "无", image: item.image, vpcId: item.vpc, subnetId: item.subnet ?? "",
    privateIp: item.private_ip ?? "", publicIp: item.public_ip ?? "", bandwidth: item.bandwidth ?? 0, bandwidthOut: item.bandwidth_out ?? 0, networkType: item.network_type ?? "", billing: item.billing_mode,
    price: item.price, autoRenew: item.auto_renew, systemDisk: item.disk_gib, dataDisks: [], securityGroupIds: item.security_group_ids ?? [],
    resourceGroupId: "", createdAt: item.created_at, expiresAt: item.updated_at,
    source: item.provider_account_id ? "aliyun-sync" : "tenant",
    providerResourceId: item.provider_resource_id, providerAccountId: item.provider_account_id,
  };
}

function metadataValue(metadata: unknown, key: string): unknown {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  return (metadata as Record<string, unknown>)[key];
}

function metadataString(metadata: unknown, key: string): string {
  const value = metadataValue(metadata, key);
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function metadataNumber(metadata: unknown, key: string): number {
  const value = metadataValue(metadata, key);
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSyncedStatus(status: string): Instance["status"] {
  const value = status.trim().toLowerCase();
  if (["running", "stopped", "error", "provisioning"].includes(value)) return value === "provisioning" ? "creating" : value as Instance["status"];
  if (["starting", "stopping", "rebooting"].includes(value)) return "creating";
  return "error";
}

function mapSyncedInstance(item: AdminProviderSyncResource): Instance {
  const metadata = item.metadata;
  const chargeType = metadataString(metadata, "charge_type").toLowerCase();
  const createdAt = metadataString(metadata, "creation_time") || item.first_seen_at;
  const expiresAt = metadataString(metadata, "expired_time") || undefined;
  const gpuAmount = metadataNumber(metadata, "gpu_amount");
  const gpuSpec = metadataString(metadata, "gpu_spec");
  return {
    id: item.provider_resource_id,
    name: item.name || item.provider_resource_id,
    status: normalizeSyncedStatus(item.status),
    region: item.region_id,
    zone: metadataString(metadata, "zone_id"),
    cpu: metadataNumber(metadata, "vcpu"),
    memory: metadataNumber(metadata, "memory_gib"),
    gpu: gpuAmount > 0 ? `${gpuSpec || "GPU"} x${gpuAmount}` : "无",
    image: metadataString(metadata, "os_name") || metadataString(metadata, "image_id") || "-",
    vpcId: metadataString(metadata, "vpc_id"),
    subnetId: metadataString(metadata, "vswitch_id"),
    privateIp: metadataString(metadata, "private_ip"),
    publicIp: metadataString(metadata, "public_ip"),
    bandwidth: metadataNumber(metadata, "public_bandwidth_in_mbps"),
    bandwidthOut: metadataNumber(metadata, "public_bandwidth_out_mbps"),
    networkType: metadataString(metadata, "network_type"),
    billing: chargeType === "prepaid" ? "monthly" : "hourly",
    price: 0,
    autoRenew: Boolean(metadataValue(metadata, "auto_renew_enabled")),
    systemDisk: 0,
    dataDisks: [],
    securityGroupIds: Array.isArray(metadataValue(metadata, "security_group_ids")) ? metadataValue(metadata, "security_group_ids") as string[] : [],
    resourceGroupId: metadataString(metadata, "resource_group_id"),
    createdAt,
    expiresAt,
    source: "aliyun-sync",
    providerResourceId: item.provider_resource_id,
    providerAccountId: item.provider_account_id,
  };
}

function mergeSyncedInstances(instances: Instance[], synced: AdminProviderSyncResource[]): Instance[] {
  const known = new Set(instances.flatMap((item) => [item.id, item.providerResourceId ?? ""]));
  return [...instances, ...synced.filter((item) => item.status.toLowerCase() !== "deleted" && !known.has(item.provider_resource_id)).map(mapSyncedInstance)];
}

function mapRemoteOrder(item: ApiOrder): Order {
  return {
    id: item.id, instanceId: "", resourceName: item.resource_name, type: item.type === "renewal" ? "renewal" : "purchase",
    status: item.status === "successful" ? "successful" : item.status === "cancelled" ? "cancelled" : "pending",
    amount: item.final_amount, createdAt: item.created_at, paidAt: item.paid_at ?? undefined,
  };
}

function mapCloudVpc(item: CloudVPC): Vpc {
  return { id: item.id, name: item.name, cidr: item.cidr, region: item.region_id, status: "available", createdAt: "" };
}

function mapCloudSubnet(item: CloudSubnet): Subnet {
  return { id: item.id, name: item.name, vpcId: item.vpc_id, region: item.region_id, cidr: item.cidr, zone: item.zone_id, availableIps: item.available_ip };
}

function mapCloudSecurityGroup(item: CloudSecurityGroup): SecurityGroup {
  return { id: item.id, name: item.name, vpcId: item.vpc_id, region: item.region_id, description: item.description, rules: [] };
}

function mapCloudDisk(item: CloudDisk): Disk {
  return { id: item.id, name: item.name, size: item.size_gib, type: item.category.toLowerCase().includes("essd") ? "ESSD" : "SSD", region: item.region_id, zone: item.zone_id, status: item.instance_id ? "in-use" : "available", instanceId: item.instance_id, createdAt: "" };
}

function mapCloudEip(item: CloudEIP): PublicIp {
  const bound = item.status.toLowerCase().includes("inuse") || item.status.toLowerCase().includes("bound");
  return { id: item.id, address: item.address, region: item.region_id, bandwidth: 0, status: bound ? "bound" : "available" };
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const known = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !known.has(item.id))];
}

function mapSyncedVpc(item: AdminProviderSyncResource): Vpc {
  return { id: item.provider_resource_id, name: item.name || item.provider_resource_id, cidr: metadataString(item.metadata, "cidr") || metadataString(item.metadata, "cidr_block"), region: item.region_id, status: "available", createdAt: item.first_seen_at };
}

function mapSyncedSubnet(item: AdminProviderSyncResource): Subnet {
  return { id: item.provider_resource_id, name: item.name || item.provider_resource_id, vpcId: metadataString(item.metadata, "vpc_id"), region: item.region_id, cidr: metadataString(item.metadata, "cidr") || metadataString(item.metadata, "cidr_block"), zone: metadataString(item.metadata, "zone_id"), availableIps: metadataNumber(item.metadata, "available_ip") };
}

function mapSyncedSecurityGroup(item: AdminProviderSyncResource): SecurityGroup {
  return { id: item.provider_resource_id, name: item.name || item.provider_resource_id, vpcId: metadataString(item.metadata, "vpc_id"), region: item.region_id, description: metadataString(item.metadata, "description"), rules: [] };
}

function mapSyncedDisk(item: AdminProviderSyncResource): Disk {
  const category = metadataString(item.metadata, "category").toLowerCase();
  return { id: item.provider_resource_id, name: item.name || item.provider_resource_id, size: metadataNumber(item.metadata, "size_gib"), type: category.includes("essd") ? "ESSD" : "SSD", region: item.region_id, zone: metadataString(item.metadata, "zone_id"), status: metadataString(item.metadata, "instance_id") ? "in-use" : "available", instanceId: metadataString(item.metadata, "instance_id") || undefined, createdAt: item.first_seen_at };
}

function mapSyncedEip(item: AdminProviderSyncResource): PublicIp {
  const address = metadataString(item.metadata, "address") || item.name;
  const status = item.status.toLowerCase();
  return { id: item.provider_resource_id, address, region: item.region_id, bandwidth: metadataNumber(item.metadata, "bandwidth"), status: status.includes("inuse") || status.includes("bound") ? "bound" : "available", instanceId: metadataString(item.metadata, "instance_id") || undefined };
}

async function loadSyncedResources(isAdmin: boolean) {
  const empty = { vpcs: [] as Vpc[], subnets: [] as Subnet[], securityGroups: [] as SecurityGroup[], disks: [] as Disk[], publicIps: [] as PublicIp[] };
  if (!isAdmin) return empty;
  const [vpcs, subnets, securityGroups, disks, eips] = await Promise.all([
    api.adminSyncResources("", "vpc").catch(() => []),
    api.adminSyncResources("", "subnet").catch(() => []),
    api.adminSyncResources("", "security_group").catch(() => []),
    api.adminSyncResources("", "disk").catch(() => []),
    api.adminSyncResources("", "eip").catch(() => []),
  ]);
  return { vpcs: vpcs.map(mapSyncedVpc), subnets: subnets.map(mapSyncedSubnet), securityGroups: securityGroups.map(mapSyncedSecurityGroup), disks: disks.map(mapSyncedDisk), publicIps: eips.map(mapSyncedEip) };
}

type Update = (state: ConsoleState) => ConsoleState;
interface StoreValue { state: ConsoleState; user: ApiUser | null; loading: boolean; ready: boolean; error: string; mutate: (update: Update, message?: string) => Promise<boolean>; reset: () => Promise<boolean>; reload: () => Promise<void>; createInstances: (draft: InstanceDraft) => Promise<Instance[]>; toast: string; clearToast: () => void; }
const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConsoleState>(() => structuredClone(seed));
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const stateRef = useRef(state);
  const revisionRef = useRef(0);
  const applySnapshot = useCallback((snapshot: { revision: number; state: ConsoleState }) => {
    revisionRef.current = snapshot.revision;
    stateRef.current = snapshot.state;
    setState(snapshot.state);
  }, []);
  const upgradeState = useCallback((input: ConsoleState): ConsoleState => input.version === seed.version ? ({
    ...structuredClone(seed), ...input, version: seed.version,
    notifications: input.notifications ?? [], authorizations: input.authorizations ?? [],
    quotaRequests: input.quotaRequests ?? [], supportTickets: input.supportTickets ?? [],
  }) : structuredClone(seed), []);
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const profile = await api.ensureDemoSession();
      setUser(profile);
      try {
        const snapshot = await api.consoleState<ConsoleState>();
        const upgraded = upgradeState(snapshot.state);
        const [remoteInstances, remoteOrders, wallet, remoteVpcs, remoteEips, remoteDisks, remoteSecurityGroups, syncedInstances] = await Promise.all([
          api.instances().catch(() => []), api.orders().catch(() => []), api.wallet().catch(() => null),
          api.cloudVpcs().catch(() => []), api.cloudEips().catch(() => []), api.cloudDisks().catch(() => []), api.cloudSecurityGroups().catch(() => []),
          profile.role === "admin" ? api.adminSyncResources("", "instance").catch(() => []) : Promise.resolve([] as AdminProviderSyncResource[]),
        ]);
        upgraded.instances = mergeSyncedInstances(remoteInstances.map(mapRemoteInstance), syncedInstances);
        upgraded.orders = remoteOrders.map(mapRemoteOrder);
        upgraded.vpcs = remoteVpcs.map(mapCloudVpc);
        upgraded.publicIps = remoteEips.map(mapCloudEip);
        upgraded.disks = remoteDisks.map(mapCloudDisk);
        upgraded.securityGroups = remoteSecurityGroups.map(mapCloudSecurityGroup);
        if (!upgraded.selectedRegion) upgraded.selectedRegion = remoteVpcs[0]?.region_id ?? remoteInstances[0]?.region ?? "";
        upgraded.subnets = upgraded.subnets.map((item) => ({ ...item, region: item.region || upgraded.vpcs.find((vpc) => vpc.id === item.vpcId)?.region || upgraded.selectedRegion }));
        upgraded.securityGroups = upgraded.securityGroups.map((item) => ({ ...item, region: item.region || upgraded.vpcs.find((vpc) => vpc.id === item.vpcId)?.region || upgraded.selectedRegion }));
        upgraded.disks = upgraded.disks.map((item) => ({ ...item, region: item.region || upgraded.selectedRegion }));
        upgraded.publicIps = upgraded.publicIps.map((item) => ({ ...item, region: item.region || upgraded.selectedRegion }));
        const remoteSubnets = (await Promise.all(remoteVpcs.map((vpc) => api.cloudSubnets(vpc.id).catch(() => [])))).flat();
        upgraded.subnets = remoteSubnets.map(mapCloudSubnet);
        const syncedResources = await loadSyncedResources(profile.role === "admin");
        upgraded.vpcs = mergeById(upgraded.vpcs, syncedResources.vpcs);
        upgraded.subnets = mergeById(upgraded.subnets, syncedResources.subnets);
        upgraded.securityGroups = mergeById(upgraded.securityGroups, syncedResources.securityGroups);
        upgraded.disks = mergeById(upgraded.disks, syncedResources.disks);
        upgraded.publicIps = mergeById(upgraded.publicIps, syncedResources.publicIps);
        if (wallet) upgraded.balance = wallet.balance;
        const needsSave = snapshot.state.version !== seed.version || JSON.stringify(snapshot.state) !== JSON.stringify(upgraded);
        if (needsSave) applySnapshot(await api.saveConsoleState(snapshot.revision, upgraded, `同步真实资源数据到控制台 v${seed.version}`));
        else applySnapshot({ ...snapshot, state: upgraded });
      } catch (requestError) {
        if (!(requestError instanceof ApiError) || requestError.status !== 404) throw requestError;
        const [remoteInstances, remoteOrders, wallet, remoteVpcs, remoteEips, remoteDisks, remoteSecurityGroups, syncedInstances] = await Promise.all([
          api.instances().catch(() => []), api.orders().catch(() => []), api.wallet().catch(() => null),
          api.cloudVpcs().catch(() => []), api.cloudEips().catch(() => []), api.cloudDisks().catch(() => []), api.cloudSecurityGroups().catch(() => []),
          profile.role === "admin" ? api.adminSyncResources("", "instance").catch(() => []) : Promise.resolve([] as AdminProviderSyncResource[]),
        ]);
        const initial = structuredClone(seed);
        initial.instances = mergeSyncedInstances(remoteInstances.map(mapRemoteInstance), syncedInstances);
        initial.orders = remoteOrders.map(mapRemoteOrder);
        initial.vpcs = remoteVpcs.map(mapCloudVpc);
        initial.publicIps = remoteEips.map(mapCloudEip);
        initial.disks = remoteDisks.map(mapCloudDisk);
        initial.securityGroups = remoteSecurityGroups.map(mapCloudSecurityGroup);
        initial.selectedRegion = remoteVpcs[0]?.region_id ?? remoteInstances[0]?.region ?? "";
        initial.subnets = initial.subnets.map((item) => ({ ...item, region: item.region || initial.vpcs.find((vpc) => vpc.id === item.vpcId)?.region || initial.selectedRegion }));
        initial.securityGroups = initial.securityGroups.map((item) => ({ ...item, region: item.region || initial.vpcs.find((vpc) => vpc.id === item.vpcId)?.region || initial.selectedRegion }));
        initial.disks = initial.disks.map((item) => ({ ...item, region: item.region || initial.selectedRegion }));
        initial.publicIps = initial.publicIps.map((item) => ({ ...item, region: item.region || initial.selectedRegion }));
        initial.subnets = (await Promise.all(remoteVpcs.map((vpc) => api.cloudSubnets(vpc.id).catch(() => [])))).flat().map(mapCloudSubnet);
        const syncedResources = await loadSyncedResources(profile.role === "admin");
        initial.vpcs = mergeById(initial.vpcs, syncedResources.vpcs);
        initial.subnets = mergeById(initial.subnets, syncedResources.subnets);
        initial.securityGroups = mergeById(initial.securityGroups, syncedResources.securityGroups);
        initial.disks = mergeById(initial.disks, syncedResources.disks);
        initial.publicIps = mergeById(initial.publicIps, syncedResources.publicIps);
        if (wallet) initial.balance = wallet.balance;
        applySnapshot(await api.saveConsoleState(0, initial, "初始化真实控制台数据"));
      }
      setReady(true);
    } catch (requestError) {
      setReady(false);
      setError(requestError instanceof Error ? requestError.message : "无法连接数据库服务");
    } finally { setLoading(false); }
  }, [applySnapshot, upgradeState]);
  const persist = useCallback(async (revision: number, next: ConsoleState, operation: string) => {
    try {
      return await api.saveConsoleState(revision, next, operation);
    } catch (requestError) {
      if (!(requestError instanceof ApiError) || requestError.status !== 401) throw requestError;
      await api.ensureDemoSession();
      return api.saveConsoleState(revision, next, operation);
    }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void reload(), 0); return () => window.clearTimeout(timer); }, [reload]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2600); return () => window.clearTimeout(timer); }, [toast]);
  const mutate = useCallback(async (update: Update, message?: string) => {
    if (!ready || loading) return false;
    setLoading(true); setError("");
    try {
      const next = update(structuredClone(stateRef.current));
      applySnapshot(await persist(revisionRef.current, next, message || "更新控制台数据"));
      if (message) setToast(message);
      return true;
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        setToast("数据已在其他页面更新，正在重新加载");
        await reload();
      } else {
        setToast(requestError instanceof Error ? `保存失败：${requestError.message}` : "保存失败，请重试");
      }
      return false;
    } finally { setLoading(false); }
  }, [applySnapshot, loading, persist, ready, reload]);
  const createInstances = useCallback(async (draft: InstanceDraft) => {
    if (!ready || loading) return [];
    setLoading(true);
    try {
      const current = stateRef.current;
      if (!draft.offeringId) throw new Error("请选择后台已配置的实例规格");
      const resourceGroupName = current.resourceGroups.find((item) => item.id === draft.resourceGroupId)?.name ?? "default";
      const offeringId = draft.offeringId;
      const remoteInstances = await api.createInstances({
        offering_id: offeringId,
        name: draft.name,
        billing_mode: draft.billing,
        duration: draft.duration,
        quantity: draft.quantity,
        image: draft.image,
        vpc: draft.vpcId,
        private_ip: draft.privateIp || null,
        auto_renew: draft.autoRenew,
        resource_group: resourceGroupName,
      });
      if (remoteInstances.length !== draft.quantity) throw new Error("后端返回的实例数量与购买数量不一致");
      await reload();
      setToast(`已创建 ${remoteInstances.length} 台云服务器，订单和资源已从后台刷新`);
      return remoteInstances.map(mapRemoteInstance);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        setToast("数据已在其他页面更新，正在重新加载");
        await reload();
      } else {
        setToast(requestError instanceof Error ? `创建失败：${requestError.message}` : "创建失败，请重试");
      }
      return [];
    } finally { setLoading(false); }
  }, [loading, ready, reload]);
  const reset = useCallback(() => mutate(() => structuredClone(seed), "数据库数据已恢复为初始状态"), [mutate]);
  const value = useMemo(() => ({ state, user, loading, ready, error, mutate, createInstances, toast, clearToast: () => setToast(""), reset, reload }), [state, user, loading, ready, error, mutate, createInstances, toast, reset, reload]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function calculatePrice(draft: Pick<InstanceDraft, "cpu" | "memory" | "gpu" | "billing" | "duration" | "quantity" | "systemDisk" | "dataDisk" | "publicIp" | "bandwidth">) {
  const gpu = draft.gpu === "无" ? 0 : draft.gpu.includes("A100") ? 42 : 18;
  const hourly = draft.cpu * .12 + draft.memory * .025 + gpu + (draft.systemDisk + draft.dataDisk) * .0015 + (draft.publicIp ? draft.bandwidth * .008 : 0);
  const unitPrice = Number((hourly * (draft.billing === "monthly" ? draft.duration * 720 * .72 : draft.duration)).toFixed(2));
  return Number((unitPrice * draft.quantity).toFixed(2));
}

export function useConsoleStore() { const value = useContext(StoreContext); if (!value) throw new Error("StoreProvider is missing"); return value; }
export { id };
export type { AlertRule, ApiKey, ConsoleUser, Disk, ResourceGroup, SecurityGroup, Tag, Vpc };
