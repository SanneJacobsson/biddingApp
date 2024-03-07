import { useEffect, useState } from "react";
import "./App.css";
import { Socket, io } from "socket.io-client";
import { Product } from "./models/Product";

function App() {
  const [socket, setSocket] = useState<Socket>();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [userName, setUserName] = useState("");
  const [currentBid, setCurrentBid] = useState(0);
  const [current, setCurrent] = useState("PÅGÅENDE");
  const [sold, setSold] = useState("AVSLUTAD & SÅLD");
  const [noSaleFinish, setNoSaleFinish] = useState("AVSLUTAD & EJ SÅLD");
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {
    if (socket) return;

    const s = io("http://localhost:3000");

    s.on("product_list", (products: Product[]) => {
      setProducts(products);
    });

    s.on("bid_accepted", (product: Product) => {
      setSelectedProduct(product);
    });

    setSocket(s);
  }, [setSocket, socket]);

  // const handleClick = () => {
  //   const bid: Bid = {
  //     amount: 100,
  //     productId: "abc123",
  //   };
  //   // Använd callback för att få svar från servern
  //   socket?.emit("make_bid", bid, (b: Bid) => {
  //     console.log("Acctepted bid: ", b);
  //   });
  // };

  const handleClick = (
    id: string,
    isSold: boolean,
    isDeactivated: boolean,
    products: Product[]
  ) => {
    socket?.emit("join_room", id, (product: Product) => {
      console.log("Joined room: ", product);
      setSelectedProduct(product);
      const disableSold = products.find((p) => p.isSold === isSold);
      const disableDeactivated = products.find(
        (p) => p.isDeactivated === isDeactivated
      );

      if (disableSold?.isSold === true) {
        setButtonDisabled(true);
        console.log("knappen är ej i funktion", buttonDisabled);
      } else {
        if (disableDeactivated?.isDeactivated === true) {
          setButtonDisabled(true);
        } else {
          setButtonDisabled(false);
        }
      }
    });
  };

  const makeBid = () => {
    socket?.emit("make_bid", {
      amount: currentBid,
      productId: selectedProduct?.id,
      bidder: userName,
      placed: new Date().toLocaleString(),
    });
  };

  return (
    <>
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => {
            handleClick(
              product.id,
              product.isSold,
              product.isDeactivated,
              products
            );
          }}
        >
          {product.name} - {product.endDate} -
          {product.isSold
            ? sold
            : product.isDeactivated
            ? noSaleFinish
            : current}
        </div>
      ))}

      {selectedProduct && (
        <>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <input
            type="number"
            value={currentBid}
            onChange={(e) => setCurrentBid(+e.target.value)}
          />
          <button onClick={makeBid} disabled={buttonDisabled}>
            Lägg bud
          </button>
          <section>
            <div>
              <h3>{selectedProduct.name}</h3>
              <ul>
                {selectedProduct.bids.map((bid, i) => (
                  <li key={i}>
                    {bid.amount} - {bid.bidder} - {bid.placed}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default App;
