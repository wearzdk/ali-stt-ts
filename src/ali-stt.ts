import NlsClient from "./nls";
import EventEmitter from "events";
import WebSocket from "ws";
import type {
  AliSTTEventMap,
  AliSTTConfig,
  StartParams,
  AliSTTResponse,
} from "./types";

export class AliSTT extends EventEmitter<AliSTTEventMap> {
  private _config: AliSTTConfig;
  private _client: NlsClient | null;
  private _taskId: string;

  constructor(config: AliSTTConfig) {
    super();
    this._config = config;
    this._client = null;
    this._taskId = "";
  }

  defaultStartParams(): StartParams {
    return {
      format: "pcm",
      sample_rate: 16000,
      enable_intermediate_result: true,
      enable_punctuation_prediction: true,
      enable_inverse_text_normalization: true,
    };
  }

  async start(
    param: StartParams = this.defaultStartParams(),
    enablePing: boolean = true,
    pingInterval: number = 6000
  ): Promise<string> {
    this._client = new NlsClient({
      url: this._config.url,
      appkey: this._config.appKey,
      token: this._config.token,
    });
    this._taskId = this._client.uuid();
    const req = {
      header: {
        message_id: this._client.uuid(),
        task_id: this._taskId,
        namespace: "SpeechTranscriber",
        name: "StartTranscription",
        appkey: this._config.appKey,
      },
      payload: param,
      context: this._client.defaultContext(),
    };

    return new Promise<string>((resolve, reject) => {
      this._client!.start(
        (msg: WebSocket.Data, isBinary: boolean) => {
          if (!isBinary) {
            const msgObj = JSON.parse(msg.toString());
            switch (msgObj.header.name) {
              case "TranscriptionStarted":
                this.emit("started", msgObj);
                resolve(msgObj);
                break;
              case "TranscriptionResultChanged":
                this.emit("changed", msgObj);
                break;
              case "TranscriptionCompleted":
                this.emit("completed", msgObj);
                break;
              case "SentenceBegin":
                this.emit("begin", msgObj);
                break;
              case "SentenceEnd":
                this.emit("end", msgObj);
                break;
              case "TaskFailed":
                this._client?.clearPing();
                this._client?.shutdown();
                this._client = null;
                this.emit("failed", msgObj);
                break;
            }
          }
        },
        () => {
          this.emit("closed");
        }
      )
        .then(() => {
          if (enablePing) {
            this._client!.setPing(pingInterval, () => {});
          }
          this._client!.send(JSON.stringify(req), false);
        })
        .catch(reject);
    });
  }

  async close(param: any = {}): Promise<AliSTTResponse<Record<string, any>>> {
    if (!this._client) {
      return Promise.reject("client is null");
    }

    const req = {
      header: {
        message_id: this._client.uuid(),
        task_id: this._taskId,
        namespace: "SpeechTranscriber",
        name: "StopTranscription",
        appkey: this._config.appKey,
      },
      payload: param,
      context: this._client.defaultContext(),
    };

    return new Promise((resolve, reject) => {
      const handleCompleted = (msg: AliSTTResponse) => {
        if (this._client) {
          this._client.clearPing();
          this._client.shutdown();
          this._client = null;
        }
        this.emit("completed", msg);
        resolve(msg);
        this.removeListener("completed", handleCompleted);
        this.removeListener("failed", handleFailed);
      };

      const handleFailed = (msg: AliSTTResponse) => {
        reject(msg);
        this.removeListener("completed", handleCompleted);
        this.removeListener("failed", handleFailed);
      };

      this.once("completed", handleCompleted);
      this.once("failed", handleFailed);

      this._client!.send(JSON.stringify(req), false);
    });
  }

  ctrl(param: any): void {
    if (!this._client) {
      throw new Error("client is null");
    }
    const req = {
      header: {
        message_id: this._client.uuid(),
        task_id: this._taskId,
        namespace: "SpeechTranscriber",
        name: "ControlTranscription",
        appkey: this._config.appKey,
      },
      payload: param,
      context: this._client.defaultContext(),
    };
    this._client.send(JSON.stringify(req), false);
  }

  shutdown(): void {
    this._client?.shutdown();
  }

  sendAudio(data: WebSocket.Data): boolean {
    if (!this._client) {
      return false;
    }
    this._client.send(data, true);
    return true;
  }
}

export default AliSTT;
