import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookTicket } from "../api";

const bigLotteryTickets = [
  { price: 500, label: "LUCKY PRICE 1 LAC", image: "/images/notes/500.png" },
  { price: 251, label: "LUCKY PRICE 50,000", image: "/images/notes/251.png" },
  { price: 151, label: "LUCKY PRICE 21,000", image: "/images/notes/151.png" },
  { price: 100, label: "LUCKY PRICE 11,000", image: "/images/notes/100.png" },
  { price: 51, label: "LUCKY PRICE 5,100", image: "/images/notes/51.png" },
];

const smallLotteryPrices = [10, 20, 50, 100, 151, 251, 500, 1000];

const LotteryPage = () => {
  const [inputs, setInputs] = useState({});
  const navigate = useNavigate();

  const handleChange = (e, key) => {
    const { value } = e.target;
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const isInputValid = (value, min, max) => {
    return value >= min && value <= max;
  };

  const handlePurchase = async (number, price, type) => {
    if (!number) {
      alert("कृपया नंबर डालें");
      return;
    }

    try {
      const response = await bookTicket({
        number,
        price,
        type, // 👈 Add type field: 'big' or 'small'
      });

      if (response.status === 200 || response.status === 201) {
        alert(`आपका टिकट (${number}) सफलतापूर्वक बुक हो गया है!`);
        navigate("/history");
      } else {
        alert("कुछ गलत हुआ, कृपया पुनः प्रयास करें");
      }
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      alert("सर्वर त्रुटि! कृपया बाद में पुनः प्रयास करें");
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-12" style={{ backgroundColor: "rgb(141, 9, 9)" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-xl md:text-2xl font-bold text-yellow-300">प्रत्येक रविवार <br /> LUCKY DRAW</h2>
        </div>
        <img src="https://i.ibb.co/6XK7QgJ/lottery-banner.png" alt="Lottery Banner" className="w-full max-w-md mx-auto" />
        <div className="text-center md:text-right mt-4 md:mt-0">
          <h2 className="text-xl md:text-2xl font-bold text-yellow-300">प्रत्येक रविवार <br /> LUCKY DRAW</h2>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white">LOTTERY</h1>
        <h2 className="text-lg font-semibold text-yellow-300">5 LUCKY WINNER</h2>
        <p className="text-sm text-white mt-2">
          अब हर week 1 लाख रुपये जीतने का मौका <br />
          <span className="font-semibold text-yellow-200">
            "हर हफ्ते मौके हैं अपनी किस्मत का चमकाने का - लकी ड्रॉ में हिस्सा लें और सपनों को सच करें!"
          </span>
        </p>
      </div>

      {/* BIG LOTTERY NUMBERS */}
      <h2 className="text-xl font-bold text-white mb-2">Big Lottery Tickets</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {bigLotteryTickets.map((item, index) => (
          <div key={index} className="p-4 flex flex-col items-center">
            <img src={item.image} alt={`${item.price} Rs`} className="w-full object-cover mb-2" style={{ maxHeight: "300px" }} />
            <p className="text-white font-semibold mb-2">{item.label}</p>
            <div className="flex items-center justify-between gap-2 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 w-full max-w-xs">
              <button
                disabled={!isInputValid(inputs[`big-${index}`], 501, 2500)}
                onClick={() => handlePurchase(inputs[`big-${index}`], item.price, "big")}
                className={`text-xs font-medium py-1 px-3 rounded ${
                  isInputValid(inputs[`big-${index}`], 501, 2500) ? "bg-green-500" : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                BUY YOUR LOTTERY NUMBER
              </button>
              <input
                type="number"
                min="501"
                max="2500"
                value={inputs[`big-${index}`] || ""}
                onChange={(e) => handleChange(e, `big-${index}`)}
                placeholder="501-2500"
                className="border border-white rounded px-2 py-1 w-16 sm:w-20 text-center text-xs bg-white text-black"
              />
            </div>
          </div>
        ))}
      </div>

      {/* SMALL LOTTERY NUMBERS */}
      <h2 className="text-xl font-bold text-white mb-2">Small Lottery Tickets</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {smallLotteryPrices.map((price, index) => (
          <div key={`small-${index}`} className="p-4 flex flex-col items-center">
            <img
              src={`/images/coins/${price}.png`}
              alt={`Coin ${price} Rs`}
              className="w-24 h-24 object-cover rounded-full shadow-md mb-2"
            />
            <p className="text-white font-semibold mb-4">LOTTERY TICKET</p>
            <div className="flex items-center justify-between gap-2 bg-black text-white px-3 py-2 rounded hover:bg-gray-800 w-full max-w-xs">
              <button
                disabled={!isInputValid(inputs[`small-${index}`], 1, 500)}
                onClick={() => handlePurchase(inputs[`small-${index}`], price, "small")}
                className={`text-xs font-medium py-1 px-3 rounded ${
                  isInputValid(inputs[`small-${index}`], 1, 500) ? "bg-green-500" : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                BUY YOUR LOTTERY NUMBER
              </button>
              <input
                type="number"
                min="1"
                max="500"
                value={inputs[`small-${index}`] || ""}
                onChange={(e) => handleChange(e, `small-${index}`)}
                placeholder="1-500"
                className="border border-white bg-white text-black rounded px-2 py-1 w-14 sm:w-16 text-center text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-white bg-yellow-400 inline-block p-4 rounded text-lg mb-4 font-bold">
          रोज लाटरी खरीदें और पाइये LOTTERY PRICE का 10 गुना
        </p>
        <div className="text-white text-sm">
          <p>LOTTERY खरीदने का TIME</p>
          <p className="font-bold">प्रातः - 10:15 TO 03:15</p>
          <p>LOTTERY खुलने का TIME</p>
          <p className="font-bold">सायं - 06:15</p>
        </div>
      </div>
    </div>
  );
};

export default LotteryPage;
