import express, { Request } from "express";
import http from "http";
import mediasoup, { types as mediasoupTypes } from "mediasoup";
import { RoomManager } from "./manager";
import dotenv from "dotenv";
dotenv.config();
import { WebSocket, WebSocketServer } from "ws";
import { RandomManager } from "./manager";
const app = express();
const mediaCodecs: any = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/H264",
    clockRate: 90000,
    parameters: {
      "packetization-mode": 1,
      "profile-level-id": "42e01f",
      "level-asymmetry-allowed": 1,
    },
  },
];
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const createWorker = async () => {
  let ww = await mediasoup.createWorker();
  ww.on("died", () => {
    console.log("mediasoup worker has died");
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });
  return ww;
};

//const worker = createWorker();
wss.on("connection", (ws: WebSocket, req: Request) => {
  ws.on("message", async (data: any) => {
    const message = JSON.parse(data);
    switch (message.type) {
      case "createRoom":
      //const router = await (await worker).createRouter({ mediaCodecs });
      //RoomManager.getInstance().addRouter(message.roomId, router);
      case "deleteRoom":
        RoomManager.getInstance().deleteRouter(message.roomId);
      case "getRtcCapabilites":
        const routerr = RoomManager.getInstance().getRouter(message.roomId);
        if (!routerr) {
          console.log(`Room doesn't exit with id ${message.roomId}`);
        }
        const cap = routerr.getRtcCapabilites;
        ws.send(
          JSON.stringify({
            type: "getRtcCapabilites",
            roomId: message.roomId,
            rtcCapaabilites: cap,
          })
        );
      case "ready":
        RandomManager.getInstance().addReady(message.id, ws);
      case "notReady":
        RandomManager.getInstance().addNotReady(message.id, ws);
    }
  });
  ws.on("close", () => {
    console.log("websocket connection closed");
  });
});
server.listen(process.env.PORT, () => {
  console.log(`server listening on port ${process.env.PORT}`);
});
