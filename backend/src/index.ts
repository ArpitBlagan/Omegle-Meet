import express, { Request } from "express";
import http from "http";
//import * as mediasoup from "mediasoup";
import cors from "cors";
//import { RoomManager } from "./manager";
import dotenv from "dotenv";

dotenv.config();
import { WebSocket, WebSocketServer } from "ws";
import { RandomManager } from "./manager";
import { Router } from "./router";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());
app.use(cookieParser());
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
// const createWorker = async () => {
//   let ww = await mediasoup.createWorker();
//   ww.on("died", () => {
//     console.log("mediasoup worker has died");
//     setTimeout(() => {
//       process.exit(1);
//     }, 2000);
//   });
//   return ww;
// };

// let worker: mediasoup.types.Worker<mediasoup.types.AppData>;
// (async function () {
//   worker = await createWorker();
// })();
// const createWebRtcTransport = async (
//   router: mediasoup.types.Router<mediasoup.types.AppData>
// ) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
//       const webRtcTransport_options = {
//         listenIps: [
//           {
//             ip: "0.0.0.0", // replace with relevant IP address
//             announcedIp: "10.0.0.115",
//           },
//         ],
//         enableUdp: true,
//         enableTcp: true,
//         preferUdp: true,
//       };

//       // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
//       let transport = await router.createWebRtcTransport(
//         webRtcTransport_options
//       );
//       console.log(`transport id: ${transport.id}`);

//       transport.on("dtlsstatechange", (dtlsState: string) => {
//         if (dtlsState === "closed") {
//           transport.close();
//         }
//       });

//       // transport.on("close", () => {
//       //   console.log("transport closed");
//       // });

//       resolve(transport);
//     } catch (error) {
//       reject(error);
//     }
//   });
// };
// let transport: any[] = [];
// let producers: any[] = [];
// let consumers: any[] = [];
// const getTransport: any = (userId: string) => {
//   let val;
//   transport.forEach((ele: any) => {
//     if (ele.userId == userId) {
//       val = ele.transport;
//     }
//   });
//   return val;
// };
wss.on("connection", (ws: WebSocket, req: Request) => {
  RandomManager.getInstance().addOnline(ws);
  ws.on("message", async (data: any) => {
    const message = JSON.parse(data);
    switch (message.type) {
      // case "joinRoom":
      //   const id = message.id;
      //   if (RoomManager.getInstance().rooms.get(id)) {
      //   } else {
      //     const router = await worker?.createRouter({ mediaCodecs });
      //     RoomManager.getInstance().addRouter(message.roomId, router);
      //   }
      //   break;
      // case "createTransport":
      //   createWebRtcTransport(
      //     RoomManager.getInstance().rooms.get(message.id)
      //   ).then(
      //     (transport: any) => {
      //       transport.push({
      //         consumer: message.consumer,
      //         transport,
      //         userId: message.userId,
      //         roomId: message.roomId,
      //       });
      //       ws.send(
      //         JSON.stringify({
      //           type: "createTransport",
      //           params: {
      //             id: transport.id,
      //             iceParameters: transport.iceParameters,
      //             iceCandidates: transport.iceCandidates,
      //             dtlsParameters: transport.dtlsParameters,
      //           },
      //         })
      //       );
      //     },
      //     (error) => {
      //       console.log(error);
      //     }
      //   );
      //   break;
      // case "deleteRoom":
      //   RoomManager.getInstance().deleteRouter(message.roomId);
      //   break;
      // case "getRtcCapabilites":
      //   const routerr = RoomManager.getInstance().getRouter(message.roomId);
      //   if (!routerr) {
      //     console.log(`Room doesn't exit with id ${message.roomId}`);
      //   }
      //   const cap = routerr.getRtcCapabilites;
      //   ws.send(
      //     JSON.stringify({
      //       type: "getRtcCapabilites",
      //       roomId: message.roomId,
      //       rtcCapaabilites: cap,
      //     })
      //   );
      //   break;
      // case "transport-produce":
      //   //@ts-ignore
      //   const tranport: any = getTransport(message.userId);
      //   if (!tranport) {
      //     break;
      //   }
      //   const producer = await tranport.produce({
      //     kind: message.kind,
      //     rtpParameters: message.rtpParameters,
      //   });
      //   //add producer and tell consumer a new producer is in the room except himself.
      //   producers.push({
      //     producer,
      //     userId: message.userId,
      //     roomId: message.roomId,
      //     socket: ws,
      //   });
      //   producers.forEach((ele) => {
      //     if (ele.userId != message.userId && ele.roomId == message.roomId) {
      //       ele.socket.send(
      //         JSON.stringify({
      //           type: "new-producer",
      //           producerId: producer.id,
      //         })
      //       );
      //     }
      //   });
      //   break;
      // case "transport-connect":
      //   //@ts-ignore
      //   const tranportt: any = getTransport(message.userId);
      //   if (!tranportt) {
      //     break;
      //   }
      //   //@ts-ignore
      //   transportt?.connect({ DtlsParameters: message.dtlsParameters });
      //   break;
      //Random Part below
      case "ready":
        RandomManager.getInstance().addReady(message.id, ws);
        break;
      case "notReady":
        RandomManager.getInstance().removeReady(message.id, ws);
        break;
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
        break;
      case "leaveGroup":
        console.log(message.id);
        const ff = RandomManager.getInstance().grouped.get(message.id);
        if (ff) {
          RandomManager.getInstance().grouped.delete(message.id);
          RandomManager.getInstance().addReady(message.id, ws);
        }
        break;
      case "iceCandidate":
        const sockett = RandomManager.getInstance().grouped.get(message.to);
        if (sockett) {
          sockett.send(JSON.stringify({ ...message }));
        }
        break;
      default:
        console.log("naaa");
        break;
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
