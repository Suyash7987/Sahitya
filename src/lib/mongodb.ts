import mongoose from "mongoose";
import { mongoErrorMessage, toDirectMongoUri, usePublicDns } from "@/lib/mongoUri";
import { dropLegacyBookTextIndexes } from "@/models/Book";
import { seedIfEmpty } from "@/lib/seed";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
  bookIndexesRepaired?: boolean;
  listenersBound?: boolean;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
  uri: null,
};

globalForMongoose.mongooseCache = cached;

const CONNECT_OPTIONS = {
  family: 4 as const,
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  maxPoolSize: 20,
};

function bindConnectionListeners() {
  if (cached.listenersBound) return;
  cached.listenersBound = true;
  mongoose.connection.on("disconnected", () => {
    // Keep cached.uri so the next connect uses the same connection string.
    cached.conn = null;
    cached.promise = null;
  });
}

function isTransientMongoError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";
  return (
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError" ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNRESET") ||
    message.includes("ECONNREFUSED") ||
    message.includes("querySrv") ||
    message.includes("openUri()") ||
    message.includes("buffering timed out") ||
    message.includes("Server selection timed out")
  );
}

export async function resetMongo() {
  cached.conn = null;
  cached.promise = null;
  cached.bookIndexesRepaired = false;
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    // Ignore a disconnect that is already in progress.
  }
}

async function resolveConnectUri(mongodbUri: string) {
  if (!mongodbUri.startsWith("mongodb+srv://")) {
    return mongodbUri;
  }

  // Windows DNS often refuses MongoDB's built-in querySrv lookup.
  // Resolve SRV ourselves over public DNS, then connect with direct hosts.
  try {
    return await toDirectMongoUri(mongodbUri);
  } catch (error) {
    console.warn("Could not resolve Atlas SRV records; falling back to mongodb+srv URI.", error);
    return mongodbUri;
  }
}

async function connectMongo() {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local");
  }

  usePublicDns();
  bindConnectionListeners();

  // Reuse an already-open connection (common after hot reload / concurrent requests).
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!cached.uri) {
    cached.uri = await resolveConnectUri(mongodbUri);
  }

  // If a previous connection is still connecting, never call openUri with another string.
  if (mongoose.connection.readyState === 2) {
    // Another connect is in flight on this process — wait for it.
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("MongoDB connection timed out while waiting for an in-flight connect."));
      }, CONNECT_OPTIONS.serverSelectionTimeoutMS);

      const onConnected = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        clearTimeout(timeout);
        mongoose.connection.off("connected", onConnected);
        mongoose.connection.off("error", onError);
      };

      mongoose.connection.on("connected", onConnected);
      mongoose.connection.on("error", onError);
    });
    return mongoose;
  }

  if (mongoose.connection.readyState === 3) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 5000);
      const onDisconnected = () => {
        clearTimeout(timeout);
        mongoose.connection.off("disconnected", onDisconnected);
        resolve();
      };
      mongoose.connection.on("disconnected", onDisconnected);
    });
  }

  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore races with disconnect.
    }
  }

  return mongoose.connect(cached.uri, CONNECT_OPTIONS);
}

async function pingMongo() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB is not connected.");
  await db.admin().command({ ping: 1 });
}

export async function dbConnect() {
  if (mongoose.connection.readyState === 1) {
    try {
      await pingMongo();
      cached.conn = mongoose;
      return cached.conn;
    } catch {
      await resetMongo();
    }
  }

  if (!cached.promise) {
    cached.promise = connectMongo()
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    // Hot reload / race: another path already opened the connection.
    if (
      error instanceof Error &&
      error.message.includes("openUri()") &&
      mongoose.connection.readyState === 1
    ) {
      cached.conn = mongoose;
      cached.promise = Promise.resolve(mongoose);
    } else {
      throw new Error(mongoErrorMessage(error));
    }
  }

  if (!cached.bookIndexesRepaired) {
    try {
      await dropLegacyBookTextIndexes();
      await seedIfEmpty();
    } catch (error) {
      console.error("MongoDB post-connect setup failed:", error);
    } finally {
      cached.bookIndexesRepaired = true;
    }
  }

  return cached.conn;
}

export async function withMongo<T>(fn: () => Promise<T>): Promise<T> {
  await dbConnect();
  try {
    return await fn();
  } catch (error) {
    if (!isTransientMongoError(error)) {
      throw error;
    }
    await resetMongo();
    try {
      await dbConnect();
      return await fn();
    } catch (retryError) {
      console.error("MongoDB retry failed:", retryError);
      throw new Error(mongoErrorMessage(retryError));
    }
  }
}
