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
  },
  {
    id: "qwe321",
    name: "Car",
    description: "A very nice car",
    price: 50000,
    highestBid: 0,
    highestBidder: "",
    bids: [],
    endDate: "2024-03-07 14:06:00",
    acceptedPrice: 80000,
    isSold: false,
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
    // products.map((p) => {
    //   return { id: p.id, name: p.name, endDate: p.endDate };
    // })
    products.filter((p) => {
      if (p.isSold === false) {
        return { id: p.id, name: p.name, endDate: p.endDate };
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
  socket.emit("end_sale", products, () => {
    products.forEach((p) => {
      if (p.bids.length !== 0) {
        const maxbid = p?.bids.reduce(function (bid, newbid) {
          return bid && bid.amount > newbid.amount ? bid : newbid;
        });
        if (Date.now().toLocaleString() < p.endDate) {
          return products;
        } else {
          if (p.acceptedPrice < maxbid.amount) {
            p.isSold = true;
          }
        }
      }
    });
    return products;
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
