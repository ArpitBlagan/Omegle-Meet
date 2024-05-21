import express, { Request } from "express";
import { WebSocket, WebSocketServer } from "ws";
import * as mediasoup from "mediasoup";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import cors from "cors";
import { TraceDirection } from "mediasoup/node/lib/fbs/common/trace-direction";
import { RtcpParameters } from "mediasoup/node/lib/fbs/rtp-parameters";
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
const app = express();

const server = http.createServer(app);
let worker: mediasoup.types.Worker<mediasoup.types.AppData>;
let transports: any[] = [];
let producers: any[] = [];
let consumers: any[] = [];
let routers: Map<
  string,
  mediasoup.types.Router<mediasoup.types.AppData>
> = new Map();
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
(async function () {
  worker = await createWorker();
})();
const createWebRtcTransport = async (
  router: mediasoup.types.Router<mediasoup.types.AppData>
) => {
  const webRtcTransport_options = {
    listenIps: [
      {
        ip: "0.0.0.0",
        announcedIp: "127.0.0.1",
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  };
  try {
    const tranport = await router.createWebRtcTransport(
      webRtcTransport_options
    );
    return tranport;
  } catch (err) {
    console.log("error while create webRtcTransport", err);
  }
};
const informConsumer = (roomId: any, userId: any, id: any) => {
  producers.forEach((producerData) => {
    if (producerData.userId !== userId && producerData.roomId === roomId) {
      console.log("informing other user about a new producer just came.");
      producerData.ws.send(
        JSON.stringify({
          type: "new-producer",
          producerId: id,
        })
      );
    }
  });
};
const addConsumer = (
  consumer: any,
  roomId: any,
  userId: any,
  ws: WebSocket
) => {
  consumers.push({ consumer, roomId, userId, ws });
};
const addProducer = async (
  producer: any,
  userId: any,
  roomId: any,
  ws: WebSocket
) => {
  producers = [...producers, { producer, userId, roomId, ws }];
};
const getTranport = (userId: any, roomId: any) => {
  let tran;
  transports.forEach((ele) => {
    console.log(userId, roomId, ele.userId, ele.roomId);
    if (ele.userId == userId && ele.roomId == roomId) {
      tran = ele.transport;
    }
  });
  return tran;
};
const wss = new WebSocketServer({ server });
wss.on("connection", (ws: WebSocket, req: Request) => {
  ws.on("message", async (data: any) => {
    const message = JSON.parse(data);
    if (message.type == "getRtcCapabilites") {
      console.log("get capabilites");
      const roomId = message.roomId;
      const router = routers.get(roomId);
      if (router) {
        console.log("router exists");
        ws.send(
          JSON.stringify({
            type: "getRtcCapabilites",
            rtcCapabilites: router?.rtpCapabilities,
          })
        );
        return;
      } else {
        console.log("creating new route");
        const router = await worker?.createRouter({ mediaCodecs });
        routers.set(roomId, router);
        ws.send(
          JSON.stringify({
            type: "getRtcCapabilites",
            rtcCapabilites: router.rtpCapabilities,
          })
        );
        return;
      }
    } else if (message.type == "createTransport") {
      const roomId = message.roomId;
      const userId = message.userId;
      const router = routers.get(roomId);
      console.log("create transport request", roomId, userId);
      if (router) {
        console.log("creating transport");
        const transport = await createWebRtcTransport(router);
        if (transport) {
          transports.push({
            roomId,
            userId,
            transport,
            consumer: message.consumer,
          });
          ws.send(
            JSON.stringify({
              type: "createTransport",
              consumer: message.consumer,
              params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
              },
              remoteProducerId: message.remoteProducerId,
            })
          );
        }
      }
    } else if (message.type == "transport-connect") {
      console.log("getting req for tranport connect", transports.length);
      let transportt: any = getTranport(message.userId, message.roomId);
      console.log("trans", transportt);
      if (transportt) {
        console.log("connectig tranport");
        transportt.connect({ dtlsParameters: message.dtlsParameters });
      }
    } else if (message.type == "transport-produce") {
      console.log("getting req for transport-produce");
      let trans: any = getTranport(message.userId, message.roomId);
      if (trans) {
        console.log("producing transport");
        const producer = trans.produce({
          kind: message.kind,
          rtpParameters: message.rtpParameters,
        });
        addProducer(producer, message.userId, message.roomId, ws);
        informConsumer(message.roomId, message.userId, producer.id);
        // producer.on("transportclose", () => {
        //   console.log("transport for this producer closed ");
        //   producer.close();
        // });
      }
    } else if (message.type == "transport-recv-connect") {
      console.log("transport-recv-connect");
      const consumerTransport = transports.find(
        (transportData) =>
          transportData.consumer &&
          transportData.transport.id == message.serverConsumerTransportId
      ).transport;
      await consumerTransport.connect({
        dtlsParameters: message.dtlsParameters,
      });
    } else if (message.type == "consume") {
      const router = routers.get(message.roomId);
      let consumerTransport = transports.find(
        (transportData) =>
          transportData.consumer && transportData.tranport.id == message.id
      ).transport;
      if (
        router?.canConsume({
          producerId: message.remoteProducerId,
          rtpCapabilities: message.rtpCapabilities,
        })
      ) {
        const consumer = await consumerTransport.consume({
          producerId: message.remoteProducerId,
          rtpCapabilities: message.rtpCapabilities,
          paused: true,
        });
        addConsumer(consumer, message.roomId, message.userId, ws);
        const params = {
          id: consumer.id,
          producerId: message.remoteProducerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          serverConsumerId: consumer.id,
        };
        ws.send(
          JSON.stringify({
            type: "consume",
            params,
          })
        );
      }
    }
  });
});
server.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
