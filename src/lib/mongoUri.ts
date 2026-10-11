import { Resolver } from "node:dns/promises";
import dns from "node:dns";

const PUBLIC_DNS = ["8.8.8.8", "8.8.4.4", "1.1.1.1"];

export function usePublicDns() {
  dns.setServers(PUBLIC_DNS);
  dns.setDefaultResultOrder("ipv4first");
}

export async function toDirectMongoUri(uri: string) {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  const parsed = new URL(uri);
  const resolver = new Resolver();
  resolver.setServers(PUBLIC_DNS);

  const srvHost = `_mongodb._tcp.${parsed.hostname}`;
  let records: Awaited<ReturnType<Resolver["resolveSrv"]>> = [];
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      records = await resolver.resolveSrv(srvHost);
      if (records.length > 0) break;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  if (records.length === 0) {
    throw lastError instanceof Error
      ? lastError
      : new Error(`No MongoDB SRV records found for ${parsed.hostname}`);
  }

  const hosts = records
    .map((record) => `${record.name.replace(/\.$/, "")}:${record.port}`)
    .sort()
    .join(",");

  const txtChunks = await resolver.resolveTxt(parsed.hostname).catch(() => []);
  const txt = txtChunks.flat().join("");
  const txtParams = new URLSearchParams(txt);
  const query = new URLSearchParams(parsed.search);

  if (!query.has("ssl") && !query.has("tls")) query.set("tls", "true");
  if (!query.has("retryWrites")) query.set("retryWrites", "true");
  if (!query.has("w")) query.set("w", "majority");
  if (!query.has("authSource") && txtParams.get("authSource")) {
    query.set("authSource", txtParams.get("authSource") ?? "admin");
  }
  if (!query.has("replicaSet") && txtParams.get("replicaSet")) {
    query.set("replicaSet", txtParams.get("replicaSet") ?? "");
  }

  const auth =
    parsed.username && parsed.password
      ? `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}@`
      : "";
  const database = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/Sahitya";

  return `mongodb://${auth}${hosts}${database}?${query.toString()}`;
}

export function mongoErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";

  if (code === "ETIMEDOUT" || raw.includes("ETIMEDOUT") || raw.includes("Server selection timed out")) {
    return "MongoDB Atlas timed out. In Atlas, open Network Access and add this computer's current IP (or 0.0.0.0/0 while developing), then retry.";
  }
  if (code === "ECONNREFUSED" || raw.includes("querySrv") || raw.includes("ECONNREFUSED")) {
    return "Cannot reach MongoDB Atlas DNS. Check your internet connection, then allow this computer's IP under Atlas Network Access.";
  }
  if (raw.includes("whitelist") || raw.includes("IP") && raw.includes("not allowed")) {
    return "MongoDB Atlas blocked this IP. In Atlas, open Network Access and allow your current IP (or 0.0.0.0/0 for local development).";
  }
  if (raw.includes("authentication failed") || raw.includes("bad auth")) {
    return "MongoDB username or password is wrong. Check MONGODB_URI in .env.local.";
  }
  if (
    raw.includes("openUri()") ||
    raw.includes("active connection with different connection strings")
  ) {
    return "MongoDB was reconnecting. Please try signing in again.";
  }
  if (raw.includes("MONGODB_URI")) {
    return raw;
  }
  const hint = raw.replace(/\s+/g, " ").trim().slice(0, 160);
  return hint
    ? `Could not connect to MongoDB. ${hint}`
    : "Could not connect to MongoDB. Check MONGODB_URI and that Atlas is reachable.";
}
