import { types as mediasoupTypes } from "mediasoup";
import { WebSocket } from "ws";
export class RoomManager {
  private static instance: RoomManager;
  public rooms: Map<string, any>;

  constructor() {
    this.rooms = new Map();
  }
  static getInstance() {
    if (!this.instance) {
      return (this.instance = new RoomManager());
    }
    return this.instance;
  }
  addRouter(roomId: string, routerr: mediasoupTypes.Router) {
    const router = this.rooms.get(roomId);
    if (!router) {
      this.rooms.set(roomId, routerr);
    }
  }
  deleteRouter(roomId: string) {
    const router = this.rooms.get(roomId);
    if (router) {
      this.rooms.delete(roomId);
    }
  }
  getRouter(roomId: string) {
    const router = this.rooms.get(roomId);
    if (!router) {
      console.log("Router does not exist");
    }
    return router;
  }
}

export class RandomManager {
  private static instance: RandomManager;
  public ready: Map<string, WebSocket>;
  public notReady: Map<string, WebSocket>;
  public grouped: Map<string, WebSocket>;
  public online: WebSocket[];
  constructor() {
    this.ready = new Map();
    this.notReady = new Map();
    this.grouped = new Map();
    this.online = [];
  }

  static getInstance() {
    if (!this.instance) {
      return (this.instance = new RandomManager());
    }
    return this.instance;
  }
  addOnline(ws: WebSocket) {
    this.online.push(ws);
  }
  removeOnline(ws: WebSocket) {
    const ff = this.online.filter((ele) => {
      return ele != ws;
    });
    this.online = ff;
  }
  getRandomAndConnect() {
    //@ts-ignore
    const keys = [];
    for (const [key, value] of this.ready) {
      keys.push(key);
    }
    if (keys.length < 2) {
      // throw new Error("Map must contain at least two elements.");
      return;
    }
    const index1 = Math.floor(Math.random() * keys.length);
    let index2;
    do {
      index2 = Math.floor(Math.random() * keys.length);
    } while (index1 === index2);
    const key1 = keys[index1];
    const key2 = keys[index2];
    console.log(key1, key2);
    const ws1 = this.ready.get(key1);
    const ws2 = this.ready.get(key2);
    if (!ws2 || !ws1) {
      console.log("not workging...");
      return;
    }
    // this.addGrouped(key1, ws1);
    // this.addGrouped(key1, ws2);
    //tell ws1 to create offer
    ws1.send(
      JSON.stringify({
        type: "createOffer",
        sendTo: key2,
        from: key1,
      })
    );
  }
  addReady(id: string, ws: WebSocket) {
    const socket = this.ready.get(id);
    if (!socket) {
      console.log("adding new ready user");
      this.ready.set(id, ws);
    }
    this.getRandomAndConnect();
  }
  removeReady(id: string, ws: WebSocket) {
    const socket = this.ready.get(id);
    if (socket) {
      this.ready.delete(id);
    }
  }
  addGrouped(id: string, ws: WebSocket) {
    this.ready.delete(id);
    const soc = this.grouped.get(id);
    if (!soc) {
      this.grouped.set(id, ws);
    }
  }
  removeGrouped(id: string, ws: WebSocket) {
    if (!this.ready.get(id)) {
      this.ready.set(id, ws);
    }
    if (this.grouped.get(id)) {
      this.grouped.delete(id);
      this.addReady(id, ws);
    }
  }
}
