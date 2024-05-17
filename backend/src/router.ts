import express, { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import z from "zod";
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
      sameSite: "none",
      httpOnly: true,
    });
    res.status(200).json({ messsage: "signined in successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
});
Router.route("/signup").post(async (req: Request, res: Response) => {
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
Router.use(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.omeet;
  jwt.verify(token, (error, decode) => {
    if (error) {
      console.log("error in middlware");
      return res.status(403).json({ message: "Authorization error" });
    }
    console.log(decode);
    req.user = decode;
    next();
  });
});
Router.route("/create").post().get();
