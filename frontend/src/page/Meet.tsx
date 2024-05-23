import { useEffect, useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import * as mediasoupClient from "mediasoup-client";
import shortid from "shortid";
import { transcode } from "buffer";
let params = {
  // mediasoup params
  encodings: [
    {
      rid: "r0",
      maxBitrate: 100000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r1",
      maxBitrate: 300000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r2",
      maxBitrate: 900000,
      scalabilityMode: "S1T3",
    },
  ],
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
  codecOptions: {
    videoGoogleStartBitrate: 1000,
  },
};
const Meet = () => {
  const { roomId } = useParams();
  const yourRef = useRef(null);
  const [userId, setUid] = useState<string | null>(null);
  const [videoParams, setV] = useState(params);
  const [audioParams, setA] = useState({});
  const [sock, setSocket] = useState<WebSocket | null>(null);
  const [deviceee, setD] = useState<mediasoupClient.types.Device | null>(null);
  const [consumers, setConsumers] = useState<any[]>([]);
  const [pendingC, setPc] = useState<any[]>([]);
  const [producerTransport, setPT] = useState<
    mediasoupClient.types.Transport<mediasoupClient.types.AppData> | undefined
  >();
  const connectSendTransport = async (producer: any) => {
    console.log("connecting send transport", audioParams, videoParams);
    //this event trigger producer.on('connect') and producer.on('produce').
    let videoProducer = await producer.produce(videoParams);
    let audioProducer = await producer.produce(audioParams);
    audioProducer?.on("trackended", () => {
      console.log("audio track ended");

      // close audio track
    });

    audioProducer?.on("transportclose", () => {
      console.log("audio transport ended");

      // close audio track
    });

    videoProducer?.on("trackended", () => {
      console.log("video track ended");

      // close video track
    });

    videoProducer?.on("transportclose", () => {
      console.log("video transport ended");

      // close video track
    });
  };
  const getMedia = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("storing audio params and video params");
        setV((prev) => {
          return { ...prev, track: stream.getVideoTracks()[0] };
        });
        setA((prev) => {
          return { ...prev, track: stream.getAudioTracks()[0] };
        });
        //@ts-ignore
        yourRef.current.srcObject = stream;
        //@ts-ignore
        yourRef.current.play();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const createSendTransport = async (
    sock: WebSocket,
    userId: string,
    roomId: any
  ) => {
    console.log("sending req to creating a transport");
    sock.send(
      JSON.stringify({
        type: "createTransport",
        consumer: false,
        userId,
        roomId,
      })
    );
  };
  const signalNewConsumerTransport = async (
    consumer: any,
    sock: WebSocket,
    userId: any,
    roomId: any
  ) => {
    //if the new producer's id is already in consumersId array return;
    if (consumers.includes(consumer)) {
      return;
    }

    setPc((prev) => {
      return [...prev, consumer];
    });
    sock.send(
      JSON.stringify({
        type: "createTransport",
        consumer: true,
        roomId: roomId,
        userId,
        remoteProducerId: consumer,
      })
    );
  };
  const connectRecvTransport = (
    transport: any,
    pId: any,
    id: any,
    ws: WebSocket,
    devicee: any,
    roId: any,
    uId: any
  ) => {
    setConsumers((prev) => {
      return [...prev, transport];
    });
    console.log("connect recv transport", pId, id, devicee.rtpCapabilities);
    ws.send(
      JSON.stringify({
        type: "consume",
        remoteProducerId: pId,
        serverConsumerTransportId: id,
        rtpCapabilities: devicee.rtpCapabilities,
        transport,
        roomId: roId,
        userId: uId,
      })
    );
  };

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:9000");
    setSocket(socket);
    const id = shortid.generate();
    setUid(id);
    getMedia();
  }, []);
  useEffect(() => {
    if (
      !sock ||
      //@ts-ignore
      !audioParams?.track ||
      //@ts-ignore
      !videoParams?.track ||
      !userId
    ) {
      console.log("cool");
      return;
    }
    console.log("calling get rtcCapabilities");
    sock.send(
      JSON.stringify({
        type: "getRtcCapabilites",
        roomId,
        userId,
      })
    );
    console.log("useEffect log", videoParams, audioParams, sock, userId);
    let devicee: mediasoupClient.types.Device;
    let consumerTransport: mediasoupClient.types.Transport<mediasoupClient.types.AppData>;
    sock.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "getRtcCapabilites") {
        console.log(message);
        devicee = new mediasoupClient.Device();
        setD(devicee);
        //@ts-ignore
        //React.forceUpdate();
        await devicee.load({ routerRtpCapabilities: message.rtcCapabilites });
        console.log("getting capabilites..");
        createSendTransport(sock, userId, roomId);
      } else if (message.type == "createTransport") {
        const params = message.params;
        console.log("getting params", params);
        if (message.consumer) {
          console.log("for Consumer");
          consumerTransport = devicee.createRecvTransport(params);
          setConsumers((prev) => {
            return [...prev];
          });
          consumerTransport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                // Signal local DTLS parameters to the server side transport
                // see server's socket.on('transport-recv-connect', ...)
                sock.send(
                  JSON.stringify({
                    type: "transport-recv-connect",
                    dtlsParameters,
                    serverConsumerTransportId: params.id,
                    roomId,
                    userId,
                  })
                );

                // Tell the transport that parameters were transmitted.
                callback();
              } catch (error) {
                // Tell the transport that something was wrong
                //@ts-ignore
                errback(error);
              }
            }
          );
          console.log("device berfor calling connectRecvTransport", devicee);
          connectRecvTransport(
            consumerTransport,
            message.remoteProducerId,
            params.id,
            sock,
            devicee,
            roomId,
            userId
          );
        } else {
          console.log("not for consumer");
          //create producer tranport using the params of a tranport that is build in server.
          const producerTranportt = devicee.createSendTransport(params);
          setPT(producerTranportt);
          //@ts-ignore
          //React.forceUpdate();
          console.log("prod transport", producerTranportt);
          producerTranportt.on(
            "connect",
            async ({ dtlsParameters }, callback) => {
              console.log("sending req to transport-connect");
              sock.send(
                JSON.stringify({
                  type: "transport-connect",
                  dtlsParameters,
                  roomId,
                  userId,
                })
              );
              callback();
            }
          );
          producerTranportt.on("produce", async (parameters) => {
            console.log("sending req to transport-produce");
            sock.send(
              JSON.stringify({
                type: "transport-produce",
                kind: parameters.kind,
                rtpParameters: parameters.rtpParameters,
                appData: parameters.appData,
                userId,
                roomId,
              })
            );
          });
          console.log("connecting send transport func call");
          await connectSendTransport(producerTranportt);
        }
      } else if (message.type == "new-producer") {
        //when ever there will a new producer we need to make a consumer tranport so that
        //we can consume its media right and every new producer need to have an new consumer.
        console.log("new producer is there in the room", message.producerId);
        signalNewConsumerTransport(message.producerId, sock, userId, roomId);
      } else if (message.type == "transport-produce") {
        if (message.producerExist) {
          sock.send(
            JSON.stringify({
              type: "getProducres",
              roomId,
              userId,
            })
          );
        }
      } else if (message.type == "producer-exist") {
        console.log("producer exist already");
        if (message.prodcuers) {
          console.log("producer exist already");
          message.producers.forEach((ele: any) => {
            signalNewConsumerTransport(ele, sock, userId, roomId);
          });
        }
      } else if (message.type == "new-producer") {
        console.log("new producer added");
        signalNewConsumerTransport(message.id, sock, userId, roomId);
      } else if (message.type == "consume") {
        console.log("consume event finally", message);
        let trans: any = message.transport;
        console.log(trans, trans.consume);
        const consumer = await consumerTransport.consume({
          id: message.params.id,
          producerId: message.params.producerId,
          kind: message.params.kind,
          rtpParameters: message.params.rtpParameters,
        });
        setConsumers((prev) => {
          return [
            ...prev,
            {
              transport: message.transport,
              consumer,
              serverConsumerTransportId: message.params.id,
              producerId: message.rpId,
            },
          ];
        });
        const newElem = document.createElement("div");

        if (message.params.kind == "audio") {
          console.log("cool");
          //append to the audio container
          newElem.innerHTML =
            '<audio id="' + message.rpId + '" autoplay></audio>';
        } else {
          console.log("hot");
          //append to the video container
          newElem.setAttribute("class", "remoteVideo");
          newElem.innerHTML =
            '<video id="' + message.rpId + '" autoplay class="video" ></video>';
        }
        document.getElementById("conference")?.appendChild(newElem);
        const { track } = consumer;
        //@ts-ignore
        document.getElementById(message.rpId).srcObject = new MediaStream([
          track,
        ]);
        console.log("resume the consumer");
        sock.send(
          JSON.stringify({
            type: "consumer-resume",
            serverConsumerId: message.params.serverConsumerId,
          })
        );
      }
    });
  }, [videoParams, audioParams, userId, sock]);
  return (
    <div className="min-h-[80dvh] mt-2 bg-gray-500 rounded-xl py-2 px-4 flex flex-col items-center">
      <h1 className="text-xl px-2 py-1 rounded-xl  my-1 w-1/2 font-mono bg-gradient-to-r from-blue-600 via-red-300 to-indigo-400 inline-block text-transparent bg-clip-text">
        Video-Conference
      </h1>
      <div id="conference" className="grid md:grid-cols-3 gap-3 ">
        <div className="py-2 px-3 bg-gray-800 rounded-xl">
          <video ref={yourRef} className="rounded-xl blur"></video>
          <p className="text-white">You</p>
        </div>
      </div>
    </div>
  );
};

export default Meet;
