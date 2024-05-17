import { useEffect } from "react";

const Call = () => {
  //const [soc,setS]=useState<WebSocket|null>(null);
  useEffect(() => {
    const socket = new WebSocket("ws:localhost:8000");

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "createRoom",
        })
      );
    };
    socket.addEventListener("message", (data) => {
      const message = JSON.parse(data.data);
      switch (message.type) {
        case "getRtcCapabilites":
      }
    });
  }, []);
  return <div>Call</div>;
};

export default Call;
