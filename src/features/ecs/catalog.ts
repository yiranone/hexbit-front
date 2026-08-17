export const instanceOfferings = [
  { name: "通用型 c3.large", cpu: 4, memory: 16, gpu: "无", price: 1.18, note: "Web 服务与中小型数据库" },
  { name: "计算型 c3.xlarge", cpu: 8, memory: 32, gpu: "无", price: 2.36, note: "批处理与高并发服务" },
  { name: "GPU 型 g2.a10", cpu: 16, memory: 64, gpu: "NVIDIA A10 24GB", price: 18.5, note: "推理与图形渲染" },
  { name: "GPU 型 g3.a100", cpu: 32, memory: 128, gpu: "NVIDIA A100 40GB", price: 48, note: "模型训练与高性能推理" },
] as const;
