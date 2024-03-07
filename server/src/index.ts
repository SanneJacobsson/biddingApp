import { Product } from "./models/Product";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Bid } from "./models/Bid";

let products: Product[] = [
  {
    id: "abc123",
    name: "Bike",
    description: "A very nice bike",
    price: 1000,
    highestBid: 0,
    highestBidder: "",
    bids: [
      //{ amount: 100, productId: "abc123", bidder: "Kalle", placed: new Date().toLocaleString() },
      //{ amount: 200, productId: "abc123", bidder: "Pelle", placed: new Date().toLocaleString() },
    ],
    endDate: "2024-03-10 14:00:00",
    acceptedPrice: 2000,
    isSold: false,
    isDeactivated: false,
  },
  {
    id: "qwe321",
    name: "Car",
    description: "A very nice car",
    price: 50000,
    highestBid: 0,
    highestBidder: "",
    bids: [],
    endDate: "2024-03-07 20:38:00",
    acceptedPrice: 80000,
    isSold: false,
    isDeactivated: false,
  },
  {
    id: "new321",
    name: "Moped",
    description: "A very nice moped",
    price: 3000,
    highestBid: 0,
    highestBidder: "",
    bids: [],
    endDate: "2024-03-07 20:38:00",
    acceptedPrice: 10000,
    isSold: false,
    isDeactivated: false,
  },
];

const PORT = 3000;
const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.emit(
    "product_list",
    products.filter((p) => {
      if (
        new Date().toLocaleString() > p.endDate &&
        p.bids.length !== 0 &&
        p.acceptedPrice < p.bids[0].amount
      ) {
        p.isSold = true;
        p.isDeactivated = true;
        return {
          id: p.id,
          name: p.name,
          endDate: p.endDate,
          isSold: p.isSold,
          isDeactivated: p.isDeactivated,
        };
      } else {
        if (
          new Date().toLocaleString() > p.endDate &&
          p.bids.length !== 0 &&
          p.acceptedPrice > p.bids[0].amount
        ) {
          p.isSold = false;
          p.isDeactivated = true;
          console.log(products);
          return {
            id: p.id,
            name: p.name,
            endDate: p.endDate,
            isDeactivated: p.isDeactivated,
          };
        } else {
          if (new Date().toLocaleString() < p.endDate) {
            p.isSold = false;
            if (p.isSold === false) {
              return { id: p.id, name: p.name, endDate: p.endDate };
            }
            console.log(products);
          }
        }
      }
    })
  );

  socket.on("join_room", (id: string, callback) => {
    socket.rooms.forEach((room) => {
      console.log("Leaving room: ", room);

      socket.leave(room);
    });

    console.log("Joining room: ", id);

    socket.join(id);

    callback(products.find((p) => p.id === id));
  });

  // Callback är den funktion som skickas med i händelsen från klienten
  socket.on("make_bid", (newbid: Bid) => {
    console.log(newbid);

    const product = products.find((p) => p.id === newbid.productId);

    if (product?.bids.length !== 0) {
      const max = product?.bids.reduce(function (bid, newbid) {
        return bid && bid.amount > newbid.amount ? bid : newbid;
      });
      if (max) {
        if (max.amount >= newbid.amount) {
          console.log("budet är för lågt");
        } else {
          product?.bids.unshift(newbid);
          io.to(newbid.productId).emit(
            "bid_accepted",
            products.find((p) => p.id === newbid.productId)
          );
        }
      }
    } else {
      if (product.price < newbid.amount) {
        product?.bids.unshift(newbid);
        io.to(newbid.productId).emit(
          "bid_accepted",
          products.find((p) => p.id === newbid.productId)
        );
      } else {
        console.log("budet är för lågt");
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
