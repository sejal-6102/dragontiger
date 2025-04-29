import { useState } from "react";
import { announceWinners } from "../api";

export default function AdminPanel() {
  const [type, setType] = useState("small"); // Changed part to type (small/big)
  const [numbers, setNumbers] = useState("");

  const handleAnnounce = async () => {
    const nums = numbers.split(",").map((n) => parseInt(n.trim()));
    await announceWinners({ type, winningNumbers: nums }); // Sending type instead of part
    alert("Winning numbers announced!");
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-red-700 to-red-900">
      <div className="max-w-lg mx-auto bg-gradient-to-b from-red-700 to-red-900 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Admin - Announce Winners</h2>

        <div className="mb-6">
          <label className="text-lg font-semibold text-gray-300 block mb-2">Select Lottery Type</label>
          <select
            className="w-full p-3 border rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            value={type}
            onChange={(e) => setType(e.target.value)} // Adjusted to set 'type' (small/big)
          >
            <option value="small">Small Lottery Number</option>
            <option value="big">Big Lottery Number</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="text-lg font-semibold text-gray-300 block mb-2">Enter Winning Numbers</label>
          <input
            type="text"
            placeholder="Enter winning numbers, comma separated"
            value={numbers}
            onChange={(e) => setNumbers(e.target.value)}
            className="w-full p-3 border rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleAnnounce}
            className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Announce Winners
          </button>
        </div>
      </div>
    </div>
  );
}
