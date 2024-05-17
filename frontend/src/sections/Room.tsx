import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
const Room = () => {
  const [room, setR] = useState("");
  const createRoom = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/room/create",
        { name: room },
        { withCredentials: true }
      );
      console.log(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="my-5">
      <h1 className="text-2xl font-mono bg-gradient-to-r from-blue-600 via-red-300 to-indigo-400 inline-block text-transparent bg-clip-text">
        Create Room and send invite to other to join
      </h1>
      <div className="flex items-center justify-end mt-3 gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Create Room</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Room</DialogTitle>
              <DialogDescription>
                create a room and let anyone to join.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <label htmlFor="link" className="sr-only">
                  Name
                </label>
                <Input
                  type="text"
                  placeholder="meeting"
                  value={room}
                  onChange={(e) => {
                    setR(e.target.value);
                  }}
                />
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  createRoom();
                }}
                size="sm"
                className="px-3"
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col justify-center items-start py-2 px-4 border border-gray-300 rounded-xl mt-3">
        <h1>Other Rooms</h1>
      </div>
    </div>
  );
};

export default Room;
