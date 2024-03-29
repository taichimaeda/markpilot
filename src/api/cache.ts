import * as child_process from "child_process";
import { createHash } from "crypto";
import { createClient, RedisClientType } from "redis";
import Markpilot from "src/main";
import { APIClient, ChatMessage } from "./openai";

export class RedisCache implements APIClient {
  private redis: RedisClientType;
  private process: child_process.ChildProcess;

  constructor(
    private client: APIClient,
    private plugin: Markpilot
  ) {}

  async initialize() {
    const { settings } = this.plugin;
    if (!settings.cache.enabled) {
      return;
    }

    const port = settings.cache.redisPort.toString();
    const path = settings.cache.redisPath;
    this.process = child_process.spawn(path, ["--port", port]);
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
    this.process.kill();
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

    const hash = createHash("sha256")
      .update(`${language}#${prefix}#${suffix}`, "utf8")
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
