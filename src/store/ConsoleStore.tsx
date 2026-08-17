import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AlertRule, ApiKey, ConsoleState, ConsoleUser, Disk, Instance, InstanceDraft, PublicIp, ResourceGroup, SecurityGroup, Tag, Vpc } from "../domain";
import { api, ApiError } from "../api";

const now = new Date();
const iso = (days = 0) => new Date(now.getTime() + days * 86400000).toISOString();
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`;
export function allocateHostIp(cidr: string, used: Set<string>, start = 10) { const octets = cidr.split("/")[0]?.split(".") ?? []; const prefix = octets.length === 4 ? octets.slice(0, 3).join(".") : "10.20.1"; for (let host = start; host <= 254; host++) { const address = `${prefix}.${host}`; if (!used.has(address)) { used.add(address); return address; } } throw new Error(`网段 ${cidr} 没有可分配的 IP 地址`); }

const seed: ConsoleState = {
  version: 4, selectedRegion: "中国重庆二期", balance: 12680.5,
  instances: [
    { id: "ins-cq-a100-001", name: "ai-inference-prod-01", status: "running", region: "重庆二期", zone: "可用区 A", cpu: 16, memory: 64, gpu: "NVIDIA A100 40GB", image: "Ubuntu 22.04 LTS", vpcId: "vpc-prod", subnetId: "subnet-prod-a", privateIp: "10.20.1.12", publicIp: "103.91.209.18", bandwidth: 100, billing: "monthly", price: 5680, autoRenew: true, systemDisk: 100, dataDisks: ["disk-data-001"], securityGroupIds: ["sg-web"], resourceGroupId: "rg-prod", createdAt: iso(-38), expiresAt: iso(22) },
    { id: "ins-cq-cpu-002", name: "data-worker-02", status: "stopped", region: "重庆二期", zone: "可用区 B", cpu: 8, memory: 32, gpu: "无", image: "Rocky Linux 9.4", vpcId: "vpc-dev", subnetId: "subnet-dev-b", privateIp: "10.30.2.24", publicIp: "未绑定", bandwidth: 0, billing: "hourly", price: 3.2, autoRenew: false, systemDisk: 80, dataDisks: [], securityGroupIds: ["sg-internal"], resourceGroupId: "rg-dev", createdAt: iso(-12) },
  ],
  orders: [
    { id: "ord-20260816-0018", instanceId: "ins-cq-a100-001", resourceName: "ai-inference-prod-01", type: "purchase", status: "successful", amount: 5680, createdAt: iso(-38), paidAt: iso(-38) },
    { id: "ord-20260804-0012", instanceId: "ins-cq-cpu-002", resourceName: "data-worker-02", type: "purchase", status: "successful", amount: 76.8, createdAt: iso(-12), paidAt: iso(-12) },
  ],
  vpcs: [
    { id: "vpc-prod", name: "生产网络", cidr: "10.20.0.0/16", region: "重庆二期", status: "available", createdAt: iso(-180) },
    { id: "vpc-dev", name: "研发网络", cidr: "10.30.0.0/16", region: "重庆二期", status: "available", createdAt: iso(-96) },
  ],
  subnets: [
    { id: "subnet-prod-a", name: "生产子网 A", vpcId: "vpc-prod", cidr: "10.20.1.0/24", zone: "可用区 A", availableIps: 241 },
    { id: "subnet-dev-b", name: "研发子网 B", vpcId: "vpc-dev", cidr: "10.30.2.0/24", zone: "可用区 B", availableIps: 246 },
  ],
  securityGroups: [
    { id: "sg-web", name: "Web 服务安全组", vpcId: "vpc-prod", description: "生产 Web 入口规则", rules: [{ id: "rule-https", direction: "in", protocol: "TCP", port: "443", source: "0.0.0.0/0", policy: "allow" }] },
    { id: "sg-internal", name: "内部服务安全组", vpcId: "vpc-dev", description: "研发环境内部访问", rules: [{ id: "rule-internal", direction: "in", protocol: "ALL", port: "全部", source: "10.30.0.0/16", policy: "allow" }] },
  ],
  disks: [{ id: "disk-data-001", name: "模型数据盘", size: 500, type: "ESSD", status: "in-use", instanceId: "ins-cq-a100-001", createdAt: iso(-38) }],
  resourceGroups: [
    { id: "rg-default", name: "默认资源组", description: "未分类资源", owner: "admin", createdAt: iso(-220) },
    { id: "rg-prod", name: "生产环境", description: "线上业务资源", owner: "admin", createdAt: iso(-180) },
    { id: "rg-dev", name: "研发环境", description: "开发和测试资源", owner: "li.ming", createdAt: iso(-96) },
  ],
  tags: [{ id: "tag-env-prod", key: "environment", value: "production", resourceCount: 3 }, { id: "tag-team-ai", key: "team", value: "ai-platform", resourceCount: 2 }],
  users: [
    { id: "usr-root", name: "admin", email: "admin@hexbit.local", role: "所有者", scope: "全部资源", status: "active", createdAt: iso(-365) },
    { id: "usr-ops", name: "李明", email: "li.ming@hexbit.local", role: "运维人员", scope: "生产环境", status: "active", createdAt: iso(-90) },
  ],
  apiKeys: [{ id: "key-demo", name: "Terraform 自动化", accessKey: "HBK8F2M9Q4X1", secretHint: "****7wQe", status: "active", createdAt: iso(-60), lastUsedAt: iso(-1) }],
  alertRules: [
    { id: "alert-cpu", name: "生产实例 CPU 过高", metric: "CPU", threshold: 85, duration: 5, enabled: true, severity: "警告", resource: "ai-inference-prod-01" },
    { id: "alert-disk", name: "系统盘使用率", metric: "磁盘", threshold: 90, duration: 10, enabled: true, severity: "严重", resource: "全部实例" },
  ],
  alertEvents: [{ id: "evt-01", ruleName: "生产实例 CPU 过高", resource: "ai-inference-prod-01", severity: "警告", status: "已恢复", occurredAt: iso(-1) }],
  billing: [
    { id: "bill-01", type: "consume", product: "云服务器", amount: -5680, createdAt: iso(-38), orderId: "ord-20260816-0018" },
    { id: "bill-02", type: "consume", product: "云服务器", amount: -76.8, createdAt: iso(-12), orderId: "ord-20260804-0012" },
    { id: "bill-03", type: "recharge", product: "账户充值", amount: 15000, createdAt: iso(-45) },
  ],
  logs: [
    { id: "log-01", instanceId: "ins-cq-a100-001", action: "启动实例", operator: "admin", result: "成功", createdAt: iso(-2) },
    { id: "log-02", instanceId: "ins-cq-cpu-002", action: "停止实例", operator: "li.ming", result: "成功", createdAt: iso(-1) },
  ],
  publicIps: [{ id: "eip-001", address: "103.91.209.18", bandwidth: 100, status: "bound", instanceId: "ins-cq-a100-001" }, { id: "eip-002", address: "103.91.209.24", bandwidth: 20, status: "available" }],
  notifications: [
    { id: "notice-billing", title: "8 月账单已经生成", body: "可前往用量与账单页面查看明细。", read: false, createdAt: iso(0) },
    { id: "notice-maintenance", title: "重庆二期可用区网络维护完成", body: "网络服务已恢复正常。", read: true, createdAt: iso(-1) },
  ],
  authorizations: [{ id: "auth-subscription", resourceId: "subscription-main", userIds: ["usr-root"], updatedAt: iso(-30) }],
  quotaRequests: [],
  supportTickets: [],
};

type Update = (state: ConsoleState) => ConsoleState;
interface StoreValue { state: ConsoleState; loading: boolean; ready: boolean; error: string; mutate: (update: Update, message?: string) => Promise<boolean>; reset: () => Promise<boolean>; reload: () => Promise<void>; createInstances: (draft: InstanceDraft) => Promise<Instance[]>; toast: string; clearToast: () => void; }
const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConsoleState>(() => structuredClone(seed));
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
  const upgradeState = useCallback((input: ConsoleState): ConsoleState => ({
    ...structuredClone(seed), ...input, version: seed.version,
    notifications: input.notifications ?? structuredClone(seed.notifications),
    authorizations: input.authorizations ?? structuredClone(seed.authorizations),
    quotaRequests: input.quotaRequests ?? [], supportTickets: input.supportTickets ?? [],
    selectedRegion: input.selectedRegion ?? seed.selectedRegion,
  }), []);
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      await api.ensureDemoSession();
      try {
        const snapshot = await api.consoleState<ConsoleState>();
        const upgraded = upgradeState(snapshot.state);
        if (snapshot.state.version !== seed.version || !snapshot.state.notifications || !snapshot.state.authorizations || !snapshot.state.quotaRequests || !snapshot.state.supportTickets) {
          applySnapshot(await api.saveConsoleState(snapshot.revision, upgraded, `升级控制台数据结构到 v${seed.version}`));
        } else {
          applySnapshot({ ...snapshot, state: upgraded });
        }
      } catch (requestError) {
        if (!(requestError instanceof ApiError) || requestError.status !== 404) throw requestError;
        applySnapshot(await api.saveConsoleState(0, structuredClone(seed), "初始化控制台数据"));
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
      const subnet = current.subnets.find((item) => item.id === draft.subnetId);
      const createdAt = new Date().toISOString();
      const unitPrice = calculatePrice({ ...draft, quantity: 1 });
      const total = unitPrice * draft.quantity;
      if (current.balance < total) throw new Error("账户余额不足，请先充值");
      if (!subnet || subnet.availableIps < draft.quantity) throw new Error("所选子网可用 IP 不足");
      const usedPrivateIps = new Set(current.instances.map((item) => item.privateIp));
      const usedPublicIps = new Set(current.publicIps.map((item) => item.address));
      const resources = Array.from({ length: draft.quantity }, (_, index) => {
        const instanceId = id("ins");
        const instanceName = draft.quantity > 1 ? `${draft.name}-${String(index + 1).padStart(2, "0")}` : draft.name;
        const diskId = draft.dataDisk > 0 ? id("disk") : undefined;
        const publicIpId = draft.publicIp ? id("eip") : undefined;
        const publicIpAddress = draft.publicIp ? allocateHostIp("103.91.209.0/24", usedPublicIps, 30) : "未绑定";
        const privateIp = draft.privateIp && draft.quantity === 1 ? draft.privateIp : allocateHostIp(subnet.cidr, usedPrivateIps, 10);
        const instance: Instance = { id: instanceId, name: instanceName, status: "running", region: draft.region, zone: draft.zone, cpu: draft.cpu, memory: draft.memory, gpu: draft.gpu, image: draft.image, vpcId: draft.vpcId, subnetId: draft.subnetId, privateIp, publicIp: publicIpAddress, bandwidth: draft.publicIp ? draft.bandwidth : 0, billing: draft.billing, price: unitPrice, autoRenew: draft.autoRenew, systemDisk: draft.systemDisk, dataDisks: diskId ? [diskId] : [], securityGroupIds: draft.securityGroupIds, resourceGroupId: draft.resourceGroupId, createdAt, expiresAt: draft.billing === "monthly" ? new Date(Date.now() + draft.duration * 30 * 86400000).toISOString() : undefined };
        const orderId = id("ord");
        const disk: Disk | undefined = diskId ? { id: diskId, name: `${instanceName}-data-01`, size: draft.dataDisk, type: "ESSD", status: "in-use", instanceId, createdAt } : undefined;
        const publicIp: PublicIp | undefined = publicIpId ? { id: publicIpId, address: publicIpAddress, bandwidth: draft.bandwidth, status: "bound", instanceId } : undefined;
        return { instance, disk, publicIp, order: { id: orderId, instanceId, resourceName: instanceName, type: "purchase" as const, status: "successful" as const, amount: unitPrice, createdAt, paidAt: createdAt }, billing: { id: id("bill"), type: "consume" as const, product: "云服务器", amount: -unitPrice, createdAt, orderId }, log: { id: id("log"), instanceId, action: "创建实例", operator: "admin", result: "成功" as const, createdAt } };
      });
      const created = resources.map((item) => item.instance);
      const next = { ...current, balance: current.balance - total, instances: [...created, ...current.instances], orders: [...resources.map((item) => item.order), ...current.orders], billing: [...resources.map((item) => item.billing), ...current.billing], logs: [...resources.map((item) => item.log), ...current.logs], disks: [...resources.flatMap((item) => item.disk ? [item.disk] : []), ...current.disks], publicIps: [...resources.flatMap((item) => item.publicIp ? [item.publicIp] : []), ...current.publicIps], subnets: current.subnets.map((item) => item.id === draft.subnetId ? { ...item, availableIps: item.availableIps - created.length } : item) };
      applySnapshot(await persist(revisionRef.current, next, `创建云服务器 ${draft.name}`));
      setToast(`已创建 ${created.length} 台云服务器，订单和关联资源已写入数据库`);
      return created;
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        setToast("数据已在其他页面更新，正在重新加载");
        await reload();
      } else {
        setToast(requestError instanceof Error ? `创建失败：${requestError.message}` : "创建失败，请重试");
      }
      return [];
    } finally { setLoading(false); }
  }, [applySnapshot, loading, persist, ready, reload]);
  const reset = useCallback(() => mutate(() => structuredClone(seed), "数据库数据已恢复为初始状态"), [mutate]);
  const value = useMemo(() => ({ state, loading, ready, error, mutate, createInstances, toast, clearToast: () => setToast(""), reset, reload }), [state, loading, ready, error, mutate, createInstances, toast, reset, reload]);
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
