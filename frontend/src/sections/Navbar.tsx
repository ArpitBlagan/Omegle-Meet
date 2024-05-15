import { Link } from "react-router-dom";
import icon from "@/img/icon.png";

const Navbar = () => {
  return (
    <div className="flex  items-center px-2 py-1 rounded-xl  bg-red-300 ">
      <div className="flex  items-center gap-3">
        <img src={icon} className="rounded-full" width={50} height={50} />
        <Link to="/">Duck</Link>
      </div>
      <div className="flex-1 flex items-center gap-2 justify-end">
        <Link to="/room">Create Room</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/signin">Signin</Link>
      </div>
    </div>
  );
};

export default Navbar;
