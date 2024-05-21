import Room from "@/sections/Room";
import Rooms from "@/sections/Rooms";
import { useState } from "react";
const createRoom = () => {
  const [change, setC] = useState(false);
  return (
    <div>
      <Room setC={setC} change={change} />
      <Rooms change={change} />
    </div>
  );
};

export default createRoom;
