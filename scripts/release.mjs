import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const releaseDir = resolve(root, "release");

if (!existsSync(dist)) {
  throw new Error("未找到 dist 目录。请先运行 npm run build。");
}

mkdirSync(releaseDir, { recursive: true });
const output = resolve(releaseDir, "aethercpu-deploy.tar.gz");
rmSync(output, { force: true });

execFileSync(
  "tar",
  [
    "-czf",
    output,
    "dist",
    "package.json",
    "package-lock.json",
    "README.md",
  ],
  { cwd: root, stdio: "inherit" },
);

console.log(`\n部署包已生成：${output}`);
