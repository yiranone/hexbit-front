export type Status = "running" | "stopped" | "creating" | "error";

export interface Instance {
  id: string; name: string; status: Status; region: string; zone: string;
  cpu: number; memory: number; gpu: string; image: string; vpcId: string;
  subnetId: string; privateIp: string; publicIp: string; bandwidth: number;
  billing: "hourly" | "monthly"; price: number; autoRenew: boolean;
  systemDisk: number; dataDisks: string[]; securityGroupIds: string[];
  resourceGroupId: string; createdAt: string; expiresAt?: string;
}
export interface Order { id: string; instanceId: string; resourceName: string; type: "purchase" | "renewal"; status: "successful" | "pending" | "cancelled"; amount: number; createdAt: string; paidAt?: string; }
export interface Vpc { id: string; name: string; cidr: string; region: string; status: "available"; createdAt: string; }
export interface Subnet { id: string; name: string; vpcId: string; cidr: string; zone: string; availableIps: number; }
export interface SecurityRule { id: string; direction: "in" | "out"; protocol: string; port: string; source: string; policy: "allow" | "deny"; }
export interface SecurityGroup { id: string; name: string; vpcId: string; description: string; rules: SecurityRule[]; }
export interface Disk { id: string; name: string; size: number; type: "SSD" | "ESSD"; status: "available" | "in-use"; instanceId?: string; createdAt: string; }
export interface ResourceGroup { id: string; name: string; description: string; owner: string; createdAt: string; }
export interface Tag { id: string; key: string; value: string; resourceCount: number; }
export interface ConsoleUser { id: string; name: string; email: string; role: "所有者" | "管理员" | "运维人员" | "只读用户"; scope: string; status: "active" | "disabled"; createdAt: string; }
export interface ApiKey { id: string; name: string; accessKey: string; secretHint: string; status: "active" | "paused" | "revoked"; createdAt: string; lastUsedAt?: string; }
export interface AlertRule { id: string; name: string; metric: "CPU" | "内存" | "磁盘" | "网络"; threshold: number; duration: number; enabled: boolean; severity: "严重" | "警告" | "提示"; resource: string; }
export interface AlertEvent { id: string; ruleName: string; resource: string; severity: string; status: "未恢复" | "已恢复"; occurredAt: string; }
export interface BillingRecord { id: string; type: "consume" | "recharge"; product: string; amount: number; createdAt: string; orderId?: string; }
export interface OperationLog { id: string; instanceId: string; action: string; operator: string; result: "成功" | "失败"; createdAt: string; }
export interface PublicIp { id: string; address: string; bandwidth: number; status: "available" | "bound"; instanceId?: string; }
export interface Notification { id: string; title: string; body: string; read: boolean; createdAt: string; }
export interface ResourceAuthorization { id: string; resourceId: string; userIds: string[]; updatedAt: string; }
export interface QuotaRequest { id: string; resource: string; requested: number; reason: string; status: "pending" | "approved" | "rejected"; createdAt: string; }
export interface SupportTicket { id: string; title: string; product: string; description: string; status: "open" | "closed"; createdAt: string; }
export interface ConsoleState {
  version: number; selectedRegion: string; balance: number; instances: Instance[]; orders: Order[]; vpcs: Vpc[];
  subnets: Subnet[]; securityGroups: SecurityGroup[]; disks: Disk[]; resourceGroups: ResourceGroup[];
  tags: Tag[]; users: ConsoleUser[]; apiKeys: ApiKey[]; alertRules: AlertRule[];
  alertEvents: AlertEvent[]; billing: BillingRecord[]; logs: OperationLog[]; publicIps: PublicIp[];
  notifications: Notification[]; authorizations: ResourceAuthorization[]; quotaRequests: QuotaRequest[]; supportTickets: SupportTicket[];
}

export interface InstanceDraft {
  name: string; region: string; zone: string; billing: "hourly" | "monthly";
  cpu: number; memory: number; gpu: string; image: string; vpcId: string; subnetId: string;
  privateIp: string; publicIp: boolean; bandwidth: number; loginType: "password" | "key";
  password: string; sshKey: string; systemDisk: number; dataDisk: number; securityGroupIds: string[];
  resourceGroupId: string; quantity: number; duration: number; autoRenew: boolean; agreement: boolean;
}
