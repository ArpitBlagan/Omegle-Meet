"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const mediasoup = __importStar(require("mediasoup"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const mediaCodecs = [
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
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
let worker;
let transports = [];
let producers = [];
let consumers = [];
let routers = new Map();
const createWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    let ww = yield mediasoup.createWorker();
    ww.on("died", () => {
        console.log("mediasoup worker has died");
        setTimeout(() => {
            process.exit(1);
        }, 2000);
    });
    return ww;
});
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        worker = yield createWorker();
    });
})();
const createWebRtcTransport = (router) => __awaiter(void 0, void 0, void 0, function* () {
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
        const tranport = yield router.createWebRtcTransport(webRtcTransport_options);
        return tranport;
    }
    catch (err) {
        console.log("error while create webRtcTransport", err);
    }
});
const informConsumer = (roomId, userId, id) => {
    producers.forEach((producerData) => {
        if (producerData.userId !== userId && producerData.roomId === roomId) {
            console.log("informing other user about a new producer just came.");
            producerData.ws.send(JSON.stringify({
                type: "new-producer",
                producerId: id,
            }));
        }
    });
};
const addConsumer = (consumer, roomId, userId, ws) => {
    consumers.push({ consumer, roomId, userId, ws });
};
const addProducer = (producer, userId, roomId, ws) => __awaiter(void 0, void 0, void 0, function* () {
    producers = [...producers, { producer, userId, roomId, ws }];
});
const getTranport = (userId, roomId) => {
    let tran;
    transports.forEach((ele) => {
        console.log(userId, roomId, ele.userId, ele.roomId);
        if (ele.userId == userId && ele.roomId == roomId) {
            tran = ele.transport;
        }
    });
    return tran;
};
const wss = new ws_1.WebSocketServer({ server });
wss.on("connection", (ws, req) => {
    ws.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const message = JSON.parse(data);
        if (message.type == "getRtcCapabilites") {
            console.log("get capabilites");
            const roomId = message.roomId;
            const router = routers.get(roomId);
            if (router) {
                console.log("router exists");
                ws.send(JSON.stringify({
                    type: "getRtcCapabilites",
                    rtcCapabilites: router === null || router === void 0 ? void 0 : router.rtpCapabilities,
                }));
                return;
            }
            else {
                console.log("creating new route");
                const router = yield (worker === null || worker === void 0 ? void 0 : worker.createRouter({ mediaCodecs }));
                routers.set(roomId, router);
                ws.send(JSON.stringify({
                    type: "getRtcCapabilites",
                    rtcCapabilites: router.rtpCapabilities,
                }));
                return;
            }
        }
        else if (message.type == "createTransport") {
            const roomId = message.roomId;
            const userId = message.userId;
            const router = routers.get(roomId);
            console.log("create transport request", roomId, userId);
            if (router) {
                console.log("creating transport");
                const transport = yield createWebRtcTransport(router);
                if (transport) {
                    transports.push({
                        roomId,
                        userId,
                        transport,
                        consumer: message.consumer,
                    });
                    ws.send(JSON.stringify({
                        type: "createTransport",
                        consumer: message.consumer,
                        params: {
                            id: transport.id,
                            iceParameters: transport.iceParameters,
                            iceCandidates: transport.iceCandidates,
                            dtlsParameters: transport.dtlsParameters,
                        },
                        remoteProducerId: message.remoteProducerId,
                    }));
                }
            }
        }
        else if (message.type == "transport-connect") {
            console.log("getting req for tranport connect", transports.length);
            let transportt = getTranport(message.userId, message.roomId);
            console.log("trans", transportt);
            if (transportt) {
                console.log("connectig tranport");
                transportt.connect({ dtlsParameters: message.dtlsParameters });
            }
        }
        else if (message.type == "transport-produce") {
            console.log("getting req for transport-produce");
            let trans = getTranport(message.userId, message.roomId);
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
        }
        else if (message.type == "transport-recv-connect") {
            console.log("transport-recv-connect");
            const consumerTransport = transports.find((transportData) => transportData.consumer &&
                transportData.transport.id == message.serverConsumerTransportId).transport;
            yield consumerTransport.connect({
                dtlsParameters: message.dtlsParameters,
            });
        }
        else if (message.type == "consume") {
            const router = routers.get(message.roomId);
            let consumerTransport = transports.find((transportData) => transportData.consumer && transportData.tranport.id == message.id).transport;
            if (router === null || router === void 0 ? void 0 : router.canConsume({
                producerId: message.remoteProducerId,
                rtpCapabilities: message.rtpCapabilities,
            })) {
                const consumer = yield consumerTransport.consume({
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
                ws.send(JSON.stringify({
                    type: "consume",
                    params,
                }));
            }
        }
    }));
});
server.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
});
