import { useEffect, useState } from "react";

const Call = ({room}:{room:string}) => {
    const [soc,setS]=useState<WebSocket|null>(null);
    useEffect(()=>{
        const socket=new WebSocket('ws:localhost:8000');
        setS(socket);
        socket.onopen=()=>{
            socket.send(JSON.stringify({
                type:'createRoom',
                
            }));
        }
        socket.addEventListener('message',(data)=>{
            const message=JSON.parse(data.data);
            switch(message.type){
                case 'getRtcCapabilites':

            }
        });
    },[]);
  return <div>Call</div>;
};

export default Call;
