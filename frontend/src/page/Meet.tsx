import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as mediasoupClient from "mediasoup-client";
import shortid from "shortid";
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
  const [userID, setUid] = useState("");
  const [videoParams, setV] = useState(params);
  const [audioParams, setA] = useState({});
  //const [socket, setSocket] = useState<WebSocket | null>(null);
  //const [device, setD] = useState<mediasoupClient.types.Device | null>(null);
  const [consumers, setConsumers] = useState<string[]>([]);
  const [producerTransport, setPT] = useState<
    mediasoupClient.types.Transport<mediasoupClient.types.AppData> | undefined
  >();
  const connectSendTransport = async (producer: any) => {
    console.log("connecting send transport", audioParams, videoParams);
    //this event trigger producer.on('connect') and producer.on('produce').
    let audioProducer = await producer.produce(audioParams);
    let videoProducer = await producer.produce(videoParams);
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
  const getMedia = (ws: WebSocket, userId: any) => {
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
        console.log("calling get rtcCapabilities");
        ws.send(
          JSON.stringify({
            type: "getRtcCapabilites",
            roomId,
            userId,
          })
        );
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

    setConsumers((prev) => {
      return [...prev, consumer];
    });
    sock.send(
      JSON.stringify({
        type: "createTransport",
        consumer: true,
        roomId: roomId,
        userId,
        remoteProducerId: consumer.id,
      })
    );
  };
  const connectRecvTransport = (tranportt: any, pId: any, id: any) => {};
  useEffect(() => {
    console.log("useEffect log", videoParams, audioParams);
  }, [videoParams, audioParams]);
  useEffect(() => {
    const sock = new WebSocket("ws://localhost:9000");
    //setSocket(sock);
    const userId = shortid.generate();
    setUid(userId);
    getMedia(sock, userId);
    let devicee: mediasoupClient.types.Device;
    sock.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "getRtcCapabilites") {
        console.log(message);
        devicee = new mediasoupClient.Device();
        //setD(devicee);
        //@ts-ignore
        //React.forceUpdate();
        await devicee.load({ routerRtpCapabilities: message.rtcCapabilites });
        console.log("getting capabilites..");
        createSendTransport(sock, userId, roomId);
      } else if (message.type == "createTransport") {
        const params = message.params;
        console.log("getting params", params);
        if (message.consumer) {
          const consumerTransport = devicee.createRecvTransport(params);
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
          connectRecvTransport(
            consumerTransport,
            message.remoteProducerId,
            params.id
          );
        } else {
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
        signalNewConsumerTransport(message.producer_id, sock, userId, roomId);
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
      } else if (message.type == "new-producer") {
        console.log("new producer added");
        signalNewConsumerTransport(message.id, sock, userId, roomId);
      }
    });
  }, []);
  return (
    <div className="min-h-[80dvh] mt-2 bg-gray-500 rounded-xl py-2 px-4 flex flex-col items-center">
      <h1 className="text-xl px-2 py-1 rounded-xl  my-1 w-1/2 font-mono bg-gradient-to-r from-blue-600 via-red-300 to-indigo-400 inline-block text-transparent bg-clip-text">
        Video-Conference
      </h1>
      <div className="grid md:grid-cols-3 gap-3 ">
        <div className="py-2 px-3 bg-gray-800 rounded-xl">
          <video ref={yourRef} className="rounded-xl blur"></video>
          <p className="text-white">You</p>
        </div>
      </div>
    </div>
  );
};

export default Meet;
