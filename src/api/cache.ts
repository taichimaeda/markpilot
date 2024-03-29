import * as child_process from "child_process";
import { createHash } from "crypto";
import { Notice } from "obsidian";
import { createClient, RedisClientType } from "redis";
import Markpilot from "src/main";
import { APIClient, ChatMessage } from "./openai";

export class RedisCache implements APIClient {
  private redis: RedisClientType;
  private process: child_process.ChildProcess | undefined;

  constructor(
    private client: APIClient,
    private plugin: Markpilot
  ) {}

  async reload() {
    await this.destroy();
    await this.initialize();
  }

  async initialize() {
    const { settings } = this.plugin;
    if (!settings.cache.enabled) {
      return;
    }

    const port = settings.cache.redisPort.toString();
    const path = settings.cache.redisPath;

    const { status } = child_process.spawnSync("lsof", ["-i", "tcp:17777"]);
    if (status !== 0) {
      new Notice("Starting Redis server.");
      this.process = child_process.spawn(path, ["--port", port, "--save", ""]);
    } else {
      new Notice("Redis server already running.");
    }

    this.redis = createClient({ url: `redis://127.0.0.1:${port}` });
    this.redis.on("error", (error) =>
      console.log("Redis client error: ", error)
    );
    await this.redis.connect();
    await this.client.initialize();
  }

  async destroy() {
    const { settings } = this.plugin;
    if (!settings.cache.enabled) {
      return;
    }

    await this.client.destroy();
    await this.redis.disconnect();

    if (this.process !== undefined) {
      this.process.kill("SIGINT");
    }
  }

  fetchChat(messages: ChatMessage[]) {
    // No caching for chats.
    return this.client.fetchChat(messages);
  }

  async fetchCompletions(language: string, prefix: string, suffix: string) {
    const { settings } = this.plugin;
    if (!settings.cache.enabled) {
      return;
    }

    // Extra whitespaces should not affect the completions.
    const compactPrefix = prefix.replace(/\s\s+/g, " ");
    const compactSuffix = suffix.replace(/\s\s+/g, " ");

    // Use half the window size
    // because some characters may have overflowed due to extra whitespaces.
    const windowSize = settings.completions.windowSize / 2;
    const truncatedPrefix = compactPrefix.slice(
      compactPrefix.length - windowSize / 2,
      compactPrefix.length
    );
    const truncatedSuffix = compactSuffix.slice(0, windowSize / 2);

    const hash = createHash("sha256")
      .update(`${language} ${truncatedPrefix} ${truncatedSuffix} `, "utf8")
      .digest("hex");

    if (await this.redis.exists(hash)) {
      const cache = await this.redis.get(hash);
      return cache as string;
    }

    const completions = await this.client.fetchCompletions(
      language,
      prefix,
      suffix
    );
    if (completions === undefined) {
      return undefined;
    }
    await this.redis.set(hash, completions);
    return completions;
  }
}
