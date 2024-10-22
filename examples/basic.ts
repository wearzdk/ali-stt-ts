import { AliSTT } from "../src";
import fs from "fs";
const stt = new AliSTT({
  url: "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1",
  appKey: process.env.ALI_STT_APP_KEY ?? "your_app_key",
  token: process.env.ALI_STT_TOKEN ?? "your_token",
});

const audioBuffer = fs.readFileSync("./test1.pcm");
const bufferSize = 2048;
const bufferCount = Math.ceil(audioBuffer.length / bufferSize);

stt.on("begin", (res) => {
  console.log("begin", res);
});

stt.on("changed", (res) => {
  console.log("changed", res);
});

stt.on("end", (res) => {
  console.log("end", res);
});

stt.on("completed", (res) => {
  console.log("completed", res);
});

stt.on("failed", (res) => {
  console.log("failed", res);
});

stt.on("closed", () => {
  console.log("closed");
});

console.log("start");
await stt.start();

for (let i = 0; i < bufferCount; i++) {
  const buffer = audioBuffer.subarray(i * bufferSize, (i + 1) * bufferSize);
  stt.sendAudio(buffer);
  await new Promise((resolve) => setTimeout(resolve, 100));
}

await stt.close();
process.exit(0);
