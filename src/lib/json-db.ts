import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

export async function readCollection<T>(file: string, fallback: T[]): Promise<T[]> {
  await fs.mkdir(dataDir, { recursive: true });
  const full = path.join(dataDir, file);
  try {
    const raw = await fs.readFile(full, "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    await fs.writeFile(full, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export async function writeCollection<T>(file: string, data: T[]) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, file), JSON.stringify(data, null, 2), "utf8");
}

export async function readObject<T>(file: string, fallback: T): Promise<T> {
  await fs.mkdir(dataDir, { recursive: true });
  const full = path.join(dataDir, file);
  try {
    const raw = await fs.readFile(full, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await fs.writeFile(full, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export async function writeObject<T>(file: string, data: T) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, file), JSON.stringify(data, null, 2), "utf8");
}
