import type { ApiOffering } from "../../api";

export type InstanceOffering = {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  gpu: string;
  price: number;
  note: string;
};

export function mapOffering(item: ApiOffering): InstanceOffering {
  const gpu = item.gpu_model ? `${item.gpu_model}${item.gpu_memory_gib ? ` ${item.gpu_memory_gib}GB` : ""}` : "无";
  return {
    id: item.id,
    name: item.name,
    cpu: item.vcpu,
    memory: item.memory_gib,
    gpu,
    price: item.price_hourly ?? item.price_monthly ?? 0,
    note: `${item.cpu_model || "通用计算"} · ${item.network_mbps} Mbps 网络`,
  };
}
