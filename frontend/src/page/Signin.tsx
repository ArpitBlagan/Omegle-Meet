import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { context } from "@/Contexxt";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
const registerSchema = z.object({
  email: z.string().email("please enter valid email"),
  password: z.string().min(6, "password shoudl be atleast 6 characters long"),
});
type registerType = z.infer<typeof registerSchema>;
const Signin = () => {
  const navigate = useNavigate();
  const value = useContext(context);
  useEffect(() => {
    if (value?.isLoggedIn) {
      navigate("/");
    }
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<registerType>({
    resolver: zodResolver(registerSchema),
  });
  const submit: SubmitHandler<registerType> = async (data) => {
    console.log(data);
    try {
      const res = await axios.post(
        "http://localhost:8000/room/signin",
        { email: data.email, password: data.password },
        { withCredentials: true }
      );
      console.log(res.data);
      toast.success("signin successfully");
      value?.setE(res.data.email);
      value?.setN(res.data.name);
      value?.setL(true);
      navigate("/");
    } catch (err) {
      console.log(err);
      toast.error("something went wrong");
    }
  };
  return (
    <div className=" flex justify-center items-center min-h-[80vh]">
      <form
        onSubmit={handleSubmit(submit)}
        className="w-1/2 flex flex-col gap-4"
      >
        <h3>
          <p>Signin in Duck</p>
          <span className="text-gray-400">
            Don't have an account{" "}
            <Link className="text-red-400" to="/signup">
              Signup
            </Link>
          </span>
        </h3>

        <div className="flex flex-col items-start">
          <label className="text-gray-300">Email*</label>
          <Input
            placeholder="arpit@gmail.com"
            type="text"
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="text-red-300">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col items-start">
          <label className="text-gray-300">Password*</label>
          <Input
            placeholder="A43@3$$"
            type="password"
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="text-red-300">{errors.password.message}</p>
          )}
        </div>
        <div className="w-full">
          <Button className="w-1/2" variant={"destructive"} type="submit">
            SignUp
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Signin;
