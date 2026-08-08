import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const distRoot = new URL("../dist/", import.meta.url);

function assetUrlFrom(html, pattern, kind) {
  const match = html.match(pattern);
  assert.ok(match, `built HTML should reference a ${kind} asset`);
  assert.match(match[1], /^\/assets\/[^"']+$/);
  return new URL(match[1].slice(1), distRoot);
}

test("builds the AetherCPU Vite SPA shell", async () => {
  const html = await readFile(new URL("index.html", distRoot), "utf8");

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html\s+lang=["']zh-CN["']/i);
  assert.match(html, /<meta\s+name=["']viewport["'][^>]*>/i);
  assert.match(
    html,
    /<meta\s+name=["']description["']\s+content=["']AetherCPU 弹性算力平台前端原型["'][^>]*>/i,
  );
  assert.match(html, /<title>AetherCPU · 弹性算力平台<\/title>/i);
  assert.match(html, /<div\s+id=["']root["']><\/div>/i);
  assert.doesNotMatch(html, /\/src\/main\.tsx/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("emits loadable JavaScript and CSS assets for the current console", async () => {
  const html = await readFile(new URL("index.html", distRoot), "utf8");
  const scriptUrl = assetUrlFrom(
    html,
    /<script(?=[^>]*\btype=["']module["'])[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/i,
    "module script",
  );
  const stylesheetUrl = assetUrlFrom(
    html,
    /<link(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i,
    "stylesheet",
  );

  const [script, stylesheet, scriptStats, stylesheetStats] = await Promise.all([
    readFile(scriptUrl, "utf8"),
    readFile(stylesheetUrl, "utf8"),
    stat(scriptUrl),
    stat(stylesheetUrl),
  ]);

  assert.ok(scriptStats.size > 0, "JavaScript bundle should not be empty");
  assert.ok(stylesheetStats.size > 0, "stylesheet bundle should not be empty");
  assert.match(script, /getElementById\([`"']root[`"']\)/);
  assert.match(script, /控制台/);
  assert.match(script, /创建资源/);
  assert.match(stylesheet, /\.dashboard/);
  assert.match(stylesheet, /\.console-home/);
});
