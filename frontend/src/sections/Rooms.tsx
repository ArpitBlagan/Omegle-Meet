import { CopyIcon } from "@radix-ui/react-icons";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ThreeDots } from "react-loading-icons";
const Rooms = (props: any) => {
  const [rooms, setR] = useState([]);
  const [loading, setL] = useState(true);
  const getRooms = async () => {
    try {
      const res = await axios.get("http://localhost:8000/room/create", {
        withCredentials: true,
      });
      toast.success("fetched rooms successfully");
      console.log(res.data);
      setR(res.data);
      setL(false);
    } catch (err) {
      console.log(err);
      toast.error("something went wrong while fetching already created rooms");
      setL(false);
    }
  };
  useEffect(() => {
    console.log("cool");
    getRooms();
  }, [props.change]);
  return (
    <div>
      <div className="flex flex-col bg-gray-500  py-2 px-4 border border-gray-300 rounded-xl mt-3 min-h-[80vh]">
        <h1 className="text-xl font-mono  mb-3">Created-Rooms.</h1>
        {loading ? (
          <div className="flex items-center justify-center">
            <ThreeDots
              stroke="#98ff98"
              strokeOpacity={0.125}
              speed={0.75}
              height={30}
              width={30}
            />
          </div>
        ) : (
          rooms.map((ele: any, index: any) => (
            <div
              key={index}
              className="flex lg:flex-row bg-gray-300 flex-col border gap-4 border-gray-300 items-center py-2 px-4 rounded-xl w-full text-gray-600"
            >
              <div className="flex items-center justify-center flex-col gap-3  ">
                <h1 className="text-xl">{ele.name}</h1>
                <p>{ele.createdAt}</p>
              </div>
              <div className="flex-1 flex flex-col gap-3 justify-center items-end">
                <div className="flex gap-3 items-center justify-center border border-gray-400 rounded-xl py-2 px-3">
                  <p className="text-md">
                    Link: {`http://localhost:5173/room/${ele.id}`}
                  </p>
                  <CopyIcon
                    width={20}
                    height={20}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(
                        `http://localhost:5173/room/:${ele.id}`
                      );
                      toast.success("url copied successfully");
                    }}
                  />
                </div>
                <Link
                  to={`/room/:${ele.id}`}
                  className="py-1 px-5 bg-green-400 rounded-xl underlined "
                >
                  Join
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rooms;
