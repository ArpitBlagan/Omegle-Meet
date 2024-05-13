import express, { Request } from "express";
import http from "http";
import mediasoup from "mediasoup";
import { WebSocket, WebSocketServer } from "ws";
const app = express();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

async function startServer() {
  const transporters = new Map();
  const worker = await mediasoup.createWorker();
  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 0,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 0,
      },
    ],
  });
  wss.on("connection", (ws: WebSocket, req: Request) => {
    ws.on("message", async (data: any) => {
      const message = JSON.parse(data);
      switch (message) {
        case "connect":
          //@ts-ignore
          const transport = await router.createWebRtcTransport();
          transporters.set(message.id, transport);
          ws.send(
            JSON.stringify({
              type: "params",
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
            })
          );
        case "message":
      }
    });
    ws.on("close", () => {
      console.log("socket connection closed");
    });
  });
}
startServer()
  .then(() => {
    server.listen(7000, () => {
      console.log("server listening on port 7000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
