import express, { Request } from "express";
import http from "http";
import mediasoup, { types as mediasoupTypes } from "mediasoup";
import cors from "cors";
import { RoomManager } from "./manager";
import dotenv from "dotenv";

dotenv.config();
import { WebSocket, WebSocketServer } from "ws";
import { RandomManager } from "./manager";
import { Router } from "express";
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["*", "http://localhost:5173"],
    credentials: true,
  })
);
app.use("/room", Router);
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

let worker: mediasoup.types.Worker<mediasoup.types.AppData>;
(async function () {
  worker = await createWorker();
})();
wss.on("connection", (ws: WebSocket, req: Request) => {
  RandomManager.getInstance().addOnline(ws);
  ws.on("message", async (data: any) => {
    const message = JSON.parse(data);
    switch (message.type) {
      case "joinRoom":
        const id = message.id;
        if (RoomManager.getInstance().rooms.get(id)) {
        } else {
          const router = await worker?.createRouter({ mediaCodecs });
          RoomManager.getInstance().addRouter(message.roomId, router);
        }
        return;
      case "createTransport":
        return;
      case "deleteRoom":
        RoomManager.getInstance().deleteRouter(message.roomId);
        return;
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
        return;
      case "ready":
        RandomManager.getInstance().addReady(message.id, ws);
        return;
      case "notReady":
        RandomManager.getInstance().removeReady(message.id, ws);
        return;
      case "createAns":
        console.log("createAns event");
        const ss = RandomManager.getInstance().grouped.get(message.to);
        if (ss) {
          console.log("socket found");
          ss.send(
            JSON.stringify({
              type: "getAns",
              answer: message.answer,
            })
          );
        }
      case "createOffer":
        const socket = RandomManager.getInstance().grouped.get(message.to);
        if (socket) {
          socket.send(
            JSON.stringify({
              type: "createAns",
              from: message.from,
              offer: message.offer,
            })
          );
        }
        return;
      case "leaveGroup":
        console.log(message.id);
        const ff = RandomManager.getInstance().grouped.get(message.id);
        if (ff) {
          RandomManager.getInstance().grouped.delete(message.id);
          RandomManager.getInstance().addReady(message.id, ws);
        }
        return;
      case "iceCandidate":
        const sockett = RandomManager.getInstance().grouped.get(message.to);
        if (sockett) {
          sockett.send(JSON.stringify({ ...message }));
        }
        return;
      default:
        console.log("naaa");
    }
  });
  ws.on("close", () => {
    console.log("websocket connection closed");
    RandomManager.getInstance().removeOnline(ws);
    return;
  });
});
server.listen(process.env.PORT, () => {
  console.log(`server listening on port ${process.env.PORT}`);
});
