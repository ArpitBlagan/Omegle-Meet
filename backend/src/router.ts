import express, { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import z from "zod";
import path from "path";
const prismaa = new PrismaClient();
const loginSchema = z.object({
  email: z.string().email("please enter valid email"),
  password: z.string().min(6, "password shoudl be atleast 6 characters long"),
});
const registerSchema = z.object({
  name: z.string(),
  email: z.string().email("please enter valid email"),
  password: z.string().min(6, "password shoudl be atleast 6 characters long"),
});
export const Router = express.Router();
Router.route("/signin").post(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ff = loginSchema.safeParse({ email, password });
  if (!ff.success) {
    return res.status(413).json({ message: "enter fields are not right" });
  }
  try {
    const user = await prismaa.user.findFirst({ where: { email } });
    if (!user) {
      res
        .status(404)
        .json({ message: `not user found with given email: ${email}` });
    }
    const token = jwt.sign(
      {
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
        },
      },
      process.env.SECRET as string
    );
    res.cookie("omeet", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({
      messsage: "signined in successfully",
      name: user?.name,
      email,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
});
Router.route("/signup").post(async (req: Request, res: Response) => {
  console.log("request coming");
  const { name, email, password } = req.body;
  const ff = registerSchema.safeParse({ email, name, password });
  if (!ff.success) {
    return res.status(413).json({ message: "enter fields are not right" });
  }
  try {
    const user = await prismaa.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      const pass = await bcrypt.hash(password, 10);
      const createdUser = await prismaa.user.create({
        data: {
          email,
          name,
          password: pass,
        },
      });
      res.status(201).json(createdUser);
    } else {
      return res.status(409).json({ message: "email already exists" });
    }
  } catch (err) {
    console.log(err);
  }
});
Router.route("/logout").post(async (req: Request, res: Response) => {
  console.log("logout request");
  //logic to remove the cookie from the browser and our case its name is omeet
  res.clearCookie("omeet", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({ message: "logged out successfully" });
});
Router.use(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.omeet;
  if (!token) {
    console.log("we are fucked up");
  }
  jwt.verify(token, process.env.SECRET as string, (error: any, decode: any) => {
    if (error) {
      console.log("error in middlware");
      return res.status(403).json({ message: "Authorization error" });
    }
    req.user = decode.user;
    next();
  });
});
Router.route("/isloggedin").get(async (req: Request, res: Response) => {
  console.log("checking user is loggedin or not");
  res
    .status(200)
    .json({ isloggedin: true, name: req.user.name, email: req.user.email });
});
Router.route("/create")
  .post(async (req: Request, res: Response) => {
    console.log("createing a room");
    const user = req.user;
    const { name } = req.body;
    try {
      const data = await prismaa.rooms.create({
        data: {
          name,
          user_id: user.id,
        },
      });
      console.log(data);
      res.status(201).json(data);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "internal server error" });
    }
  })
  .get(async (req: Request, res: Response) => {
    const user = req.user;
    try {
      const rooms = await prismaa.rooms.findMany({
        where: {
          user_id: user.id,
        },
      });
      console.log("getting", rooms);
      res.status(200).json(rooms);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "internal server error" });
    }
  });
