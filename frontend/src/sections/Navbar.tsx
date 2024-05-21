import { Link } from "react-router-dom";
import icon from "@/img/icon.png";
import { useContext, useEffect } from "react";
import { context } from "@/Contexxt";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import axios from "axios";
import toast from "react-hot-toast";
const Navbar = () => {
  const value = useContext(context);
  console.log("from navbar", value);
  useEffect(() => {
    let kk = window.location.href;
    const ff = kk.split("/")[0];
    console.log(ff);
  }, []);
  const logout = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/room/logout",
        {},
        { withCredentials: true }
      );
      console.log(res.data);
      value?.setR(!value.run);
    } catch (err) {
      console.log(err);
      toast.error("not able to log you out please try again later");
    }
  };
  return (
    <div className="flex  items-center px-2 py-1 rounded-xl  bg-red-300 ">
      <div className="flex  items-center gap-3">
        <img src={icon} className="rounded-full" width={50} height={50} />
        <Link to="/">Duck</Link>
      </div>
      <div className="flex-1 flex items-center justify-end">
        {value?.isLoggedIn ? (
          <div className="flex gap-4 items-center">
            <Link to="/room">Create-Room</Link>
            <Menubar className="bg-red-400">
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Profile
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem></MenubarItem>
                  <MenubarItem>{value.name}</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>{value.email}</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    <Button
                      variant={"destructive"}
                      onClick={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                    >
                      Logout
                    </Button>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/signup">Signup</Link>
            <Link to="/signin">Signin</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
