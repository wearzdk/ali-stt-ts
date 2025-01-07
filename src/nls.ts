import WebSocket from "ws";
import assert from "assert";
import { v4 as uuidv4 } from "uuid";
import type { NlsConfig } from "./types";

export class NlsClient {
  private _config: NlsConfig;
  private _ws: WebSocket | null = null;
  private _ping: NodeJS.Timeout | null = null;

  constructor(config: NlsConfig) {
    assert(config, 'must pass "config"');
    assert(config.url, 'must pass "url"');
    assert(config.appkey, 'must pass "appkey"');
    assert(
      config.token,
      "must first get token from cache or getToken interface"
    );
    this._config = config;
  }

  start(
    onmessage: (data: WebSocket.Data, isBinary: boolean) => void,
    onclose: () => void
  ): Promise<void> {
    if (typeof onmessage !== "function") {
      throw new Error("expect function onmessage");
    }
    if (typeof onclose !== "function") {
      throw new Error("expect function onclose");
    }
    this._ws = new WebSocket(this._config.url, {
      headers: { "X-NLS-Token": this._config.token },
      perMessageDeflate: false,
    });
    this._ws.on("message", (data: WebSocket.Data, isBinary: boolean) => {
      onmessage(data, isBinary);
    });
    this._ws.on("close", () => {
      onclose();
    });
    return new Promise<void>((resolve, reject) => {
      this._ws!.on("open", () => {
        //console.log("ws open")
        resolve();
      });
      this._ws!.on("error", (err: Error) => {
        // console.log("ws error:", err);
        reject(err);
      });
    });
  }

  send(data: WebSocket.Data, isBinary: boolean): void {
    if (this._ws == null) {
      return;
    }
    //if (!isBinary) {
    //  console.log("send:", data)
    //}
    this._ws.send(data, { binary: isBinary });
  }
  setPing(interval: number, callback: () => void): void {
    this._ping = setInterval(() => {
      //console.log("send ping")
      this._ws?.ping(callback);
    }, interval) as unknown as NodeJS.Timeout;
  }

  clearPing(): void {
    if (this._ping) {
      clearInterval(this._ping);
    }
  }

  shutdown(): void {
    if (this._ws == null) {
      //console.log("ws is null")
      return;
    }
    if (this._ping != null) {
      clearInterval(this._ping);
    }
    this._ws.terminate();
  }

  uuid(): string {
    return uuidv4().split("-").join("");
  }

  defaultContext(): {
    sdk: { name: string; version: string; language: string };
  } {
    return {
      sdk: {
        name: "nls-nodejs-sdk",
        version: "0.0.1",
        language: "nodejs",
      },
    };
  }
}

export default NlsClient;
