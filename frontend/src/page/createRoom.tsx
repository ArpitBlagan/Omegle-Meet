import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
const createRoom = () => {
  const [name, setName] = useState("");
  const createRoom = async () => {
    const body = {
      name,
    };
    const res = await axios.post("http://localhost:8000", body, {
      withCredentials: true,
    });
    console.log(res.data);
  };
  return (
    <div>
      <form>
        <div>
          <label>Room Name</label>
          <Input
            placeholder="Meet Strangers"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </div>
        <div>
          <Button
            variant={"destructive"}
            onClick={(e) => {
              e.preventDefault();
              createRoom();
            }}
          >
            Create
          </Button>
        </div>
      </form>
    </div>
  );
};

export default createRoom;
