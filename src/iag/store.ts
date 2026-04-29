import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { IAGNode } from "./types.js";

export async function appendIagNodes(path: string, nodes: IAGNode[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });

  const existing = await readExistingNodes(path);
  const next = [...existing, ...nodes];

  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

async function readExistingNodes(path: string): Promise<IAGNode[]> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as IAGNode[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
