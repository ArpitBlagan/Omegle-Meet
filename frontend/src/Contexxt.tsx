import { createContext, useEffect, useState } from "react";
import axios from "axios";
interface ff {
  isLoggedIn: boolean;
  setL: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  email: string;
  run: boolean;
  setR: React.Dispatch<React.SetStateAction<boolean>>;
  setN: React.Dispatch<React.SetStateAction<string>>;
  setE: React.Dispatch<React.SetStateAction<string>>;
}
export const context = createContext<ff | null>(null);
const Contexxt = ({ children }: any) => {
  const [isLoggedIn, setL] = useState(false);
  const [run, setR] = useState(false);
  const [name, setN] = useState("");
  const [email, setE] = useState("");
  const check = async () => {
    try {
      const res = await axios.get("http://localhost:8000/room/isloggedin", {
        withCredentials: true,
      });
      console.log("from context", res.data);
      setL(true);
      setN(res.data.name);
      setE(res.data.email);
    } catch (err) {
      console.log(err);
      setL(false);
    }
  };
  useEffect(() => {
    check();
  }, [run]);
  return (
    <context.Provider
      value={{ isLoggedIn, setL, name, setN, email, setE, run, setR }}
    >
      {children}
    </context.Provider>
  );
};

export default Contexxt;
