import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import mediasoupClient from "mediasoup-client";
const Meet = () => {
  const { roomtId } = useParams();
  const yourRef = useRef(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [device, setD] = useState<mediasoupClient.types.Device | null>(null);
  const [consumersId, setConsumersId] = useState<string[]>([]);
  const [producerTranport, setPT] = useState<
    mediasoupClient.types.Transport<mediasoupClient.types.AppData> | undefined
  >();

  const getMedia = (ws: WebSocket) => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        //@ts-ignore
        yourRef.current.srcObject = stream;
        //@ts-ignore
        yourRef.current.play();
        ws.send(
          JSON.stringify({
            type: "getRtcCapabilites",
          })
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const createSendTransport = async (sock: WebSocket) => {
    sock.send(
      JSON.stringify({
        type: "createWebRTCTransport",
        consumer: false,
      })
    );
  };
  const signalNewConsumerTransport = async (
    producer_id: any,
    sock: WebSocket
  ) => {
    //if the new producer's id is already in consumersId array return;
    if (consumersId.includes(producer_id)) {
      return;
    }

    setConsumersId((prev) => {
      return [...prev, producer_id];
    });
    sock.send(
      JSON.stringify({
        type: "createWebRTCTransport",
        consumer: false,
      })
    );
  };
  useEffect(() => {
    const sock = new WebSocket("ws://localhost:8000");
    setSocket(sock);
    sock.onopen = () => {};
    sock.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type == "getRtcCapabilites") {
        const devicee = new mediasoupClient.Device();
        setD(devicee);
        await devicee.load(message.rtcCapaabilites);
        createSendTransport(sock);
      } else if (message.type == "createWebRTCTransport") {
        const params = message.params;
        if (message.consumer) {
          //when we create a consumer tranport in server.
          let consumerTranport = device?.createRecvTransport(params);
          consumerTranport?.on("connect", async () => {});
        } else {
          //create producer tranport using the params of a tranport that is build in server.
          const producerTranportt = device?.createSendTransport(params);
          setPT(producerTranportt);
          producerTranportt?.on("connect", async () => {});
          producerTranportt?.on("produce", async () => {});
        }
      } else if (message.type == "new-producer") {
        //when ever there will a new producer we need to make a consumer tranport so that
        //we can consume its media right and every new producer need to have an new consumer.
        signalNewConsumerTransport(message.producer_id, sock);
      }
    });
    getMedia(sock);
  }, []);
  return (
    <div>
      <div>
        <video ref={yourRef}></video>
      </div>
    </div>
  );
};

export default Meet;
