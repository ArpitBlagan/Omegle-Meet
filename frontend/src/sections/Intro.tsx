import { Button } from "@/components/ui/button";
import hero from "@/img/hero.png";
import { Link } from "react-router-dom";

const Intro = () => {
  return (
    <div className="flex flex-col gap-10 justify-start items-center mt-4">
      <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:justify-around">
        <div className="">
          <h3 className="text-[50px] font-mono bg-gradient-to-r from-blue-600 via-red-300 to-indigo-400 inline-block text-transparent bg-clip-text">
            Quack Up New Connections{" "}
          </h3>
          <p>Meet strangers and have a good time.</p>
        </div>
        <img src={hero} width={500} height={300} />
      </div>
      <div className="w-full">
        <Link
          className="w-1/2 rounded-xl border border-gray-300 py-2 px-4 bg-red-300 underline"
          to="/random"
        >
          Start Fun
        </Link>
      </div>
      <p className="text-xl">
        Duck is a revolutionary new app that{" "}
        <span className="text-red-300">
          connects people from all around the globe in real-time{" "}
        </span>
        , allowing them to engage in anonymous video chats.{" "}
      </p>
    </div>
  );
};

export default Intro;
