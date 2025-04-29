import { useEffect, useState } from "react";
import { bookTicket, getTickets } from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";

export default function SelectNumbers() {
  const { part } = useParams();
  const navigate = useNavigate();
  const [inputNumbers, setInputNumbers] = useState("");
  const [booked, setBooked] = useState([]);
  const [validInput, setValidInput] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);

  const priceOptions =
    part === "2"
      ? [500, 251, 151, 100, 51]
      : [10, 20, 50, 100, 151, 251, 500, 1000];

  const priceImages = {
    coins: {
      10: "10.png",
      20: "20.png",
      50: "50.png",
      100: "100.png",
      151: "151.png",
      251: "251.png",
      500: "500.png",
      1000: "1000.png",
    },
    notes: {
      500: "500.png",
      251: "251.png",
      151: "151.png",
      100: "100.png",
      51: "51.png",
    },
  };

  useEffect(() => {
    getTickets().then(({ data }) => {
      const bookedNums = data
        .filter((t) => t.part === part)
        .map((t) => t.number);
      setBooked(bookedNums);
    });
  }, [part]);

  const validateInput = (input) => {
    const numbersArray = input
      .split(",")
      .map((num) => parseInt(num.trim()))
      .filter((num) => !isNaN(num));

    if (numbersArray.length === 0) {
      setValidInput(false);
      return;
    }

    const invalidNumbers = numbersArray.filter((num) => {
      if (part === "1") return num < 1 || num > 500;
      else if (part === "2") return num < 501 || num > 2500;
      else return true;
    });

    if (invalidNumbers.length > 0) {
      setValidInput(false);
    } else {
      setValidInput(true);
    }
  };

  const handlePurchase = async () => {
    const numbersArray = inputNumbers
      .split(",")
      .map((num) => parseInt(num.trim()))
      .filter((num) => !isNaN(num));

    const alreadyBooked = numbersArray.filter((num) => booked.includes(num));
    if (alreadyBooked.length > 0) {
      alert(`These numbers are already booked: ${alreadyBooked.join(", ")}`);
      return;
    }

    for (const number of numbersArray) {
      await bookTicket({ user: "guest", number, part, price: selectedPrice });
    }
    alert("Tickets Purchased!");
    navigate("/history");
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "rgb(141, 9, 9)" }}
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-100">
        Select Numbers ({part === "1" ? "1-500" : "501-2500"})
      </h2>

      {/* Input Field */}
      <input
        type="text"
        className="w-full p-3 rounded-lg mb-6 bg-white bg-opacity-10 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
        placeholder={
          part === "1"
            ? "Enter numbers between 1-500 (e.g., 5, 10, 50)"
            : "Enter numbers between 501-2500 (e.g., 505, 1000, 2000)"
        }
        value={inputNumbers}
        onChange={(e) => {
          setInputNumbers(e.target.value);
          validateInput(e.target.value);
          setSelectedPrice(null);
        }}
      />

      {/* Price Options */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {priceOptions.map((price) => (
          <button
            key={price}
            onClick={() => setSelectedPrice(price)}
            disabled={!validInput}
            className={`relative p-0 transition-all ${
              !validInput
                ? "cursor-not-allowed"
                : selectedPrice === price
                ? "bg-transparent"
                : "bg-transparent"
            }`}
            style={{
              width: "auto", // Allow image to resize based on content
              height: "auto",
              border: "none",
            }}
          >
            <div className="flex flex-col items-center justify-center h-full relative">
              {/* Image Only, No Box Around it */}
              <img
                src={`/images/${part === "1" ? "coins" : "notes"}/${
                  priceImages[part === "1" ? "coins" : "notes"][price] ||
                  "default.png"
                }`}
                alt={`${price}`}
                className={`${
                  part === "1"
                    ? "w-24 h-24 object-cover rounded-full" // For coin images, keep it small
                    : "w-72 h-50 object-contain" // For notes, make them more responsive
                } transition-all ${
                  selectedPrice === price
                    ? "border-2 border-green-600"
                    : "border-none"
                }`}
                onError={() => {
                  console.log(`Failed to load image for price: ${price}`);
                  console.log(
                    `Trying path: /images/${
                      part === "1" ? "coins" : "notes"
                    }/${priceImages[part === "1" ? "coins" : "notes"][price] ||
                      "default.png"}`
                  );
                }}
              />

              {/* Lock Icon Overlay when input is invalid */}
              {!validInput && (
                <FaLock
                  className={`absolute top-0 left-0 right-0 bottom-0 m-auto text-red-500 text-3xl ${
                    part === "1" ? "w-18 h-18" : "w-20 h-20"
                  }`}
                />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={!selectedPrice}
        className={`w-full py-3 rounded-lg text-xl font-bold transition-all ${
          selectedPrice
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
      >
        Purchase Tickets
      </button>
    </div>
  );
}
