import laptop from "@/img/laptop.png";
import add from "@/img/add.png";
const Second = () => {
  return (
    <div className="flex flex-col items-center gap-3 my-3">
      <div className="text-xl">
        <p>What make us different from our competitors?</p>
      </div>
      <div className="flex md:flex-row flex-col">
        <img src={laptop} width={300} height={300} />
        <img src={add} width={300} height={300} />
      </div>

      <div className="flex flex-col justify-between items-center text-xl text-red-300">
        <p>
          You can add participants or other user in ongoing call{" "}
          <span className="text-black underline">Coming Soon</span>.
        </p>
      </div>
    </div>
  );
};

export default Second;
