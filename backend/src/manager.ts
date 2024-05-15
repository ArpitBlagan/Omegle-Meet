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

  constructor() {
    this.ready = new Map();
    this.notReady = new Map();
  }

  static getInstance() {
    if (!this.instance) {
      return (this.instance = new RandomManager());
    }
    return this.instance;
  }
  addReady(id: string, ws: WebSocket) {
    const socket = this.ready.get(id);
    if (!socket) {
      this.ready.set(id, ws);
    }
  }
  addNotReady(id: string, ws: WebSocket) {
    const socket = this.ready.get(id);
    if (socket) {
      this.ready.delete(id);
    }
    if (!this.notReady.get(id)) {
      this.notReady.set(id, ws);
    }
  }
}
