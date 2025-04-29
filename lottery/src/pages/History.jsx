import { useEffect, useState } from "react";
import { getTickets, getWinners } from "../../src/api";

export default function History() {
  const [tickets, setTickets] = useState([]);
  const [winners, setWinners] = useState([]);

  const getLotteryTypeLabel = (type) => {
    if (type === "small") return "Small Lottery Number";
    if (type === "big") return "Big Lottery Number";
    return "Unknown Type";
  };

  useEffect(() => {
    // Fetch tickets
    getTickets().then(({ data }) => {
      const sortedTickets = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTickets(sortedTickets.slice(0, 10));
    });

    // Fetch winners
    getWinners().then(({ data }) => {
      const sortedWinners = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setWinners(sortedWinners.slice(0, 10));
    });
  }, []);

  // ✅ Step 1: Get the latest winner for each type
  const latestWinners = {};
  winners.forEach((winner) => {
    const existing = latestWinners[winner.type];
    if (!existing || new Date(winner.createdAt) > new Date(existing.createdAt)) {
      latestWinners[winner.type] = winner;
    }
  });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-red-600 to-red-400" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <h2 className="text-3xl font-bold mb-10 text-white text-center">
        Your Tickets & Winners History
      </h2>

      {/* Tickets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {tickets.map((ticket) => {
          const ticketTime = new Date(ticket.createdAt);
          const winner = latestWinners[ticket.type];

          
          let resultStatus = "pending";

          if (winner) {
            const winnerTime = new Date(winner.createdAt);
            const ticketTime = new Date(ticket.createdAt);
          
            if (ticketTime <= winnerTime) {
              if (ticket.number === winner.number) {
                resultStatus = "won";
              } else {
                resultStatus = "lost";
              }
            } else {
              resultStatus = "pending"; // Ticket was placed after result
            }
          }
          

          return (
            <div
              key={ticket._id}
              className={`p-6 rounded-2xl shadow-lg transition-all ${
                resultStatus === "won"
                  ? "bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-100"
                  : resultStatus === "lost"
                  ? "bg-gradient-to-r from-gray-300 via-gray-200 to-gray-100"
                  : "bg-gradient-to-r from-gray-100 to-gray-50"
              } hover:scale-105 transform duration-200 ease-in-out`}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="font-semibold text-gray-700">Number:</span> {ticket.number}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Price:</span> ₹{ticket.price}
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-4">
                <span className="font-semibold text-gray-700">Type:</span> {getLotteryTypeLabel(ticket.type)}
              </div>

              {/* Result Status */}
              {resultStatus === "pending" ? (
                <div className="flex justify-center items-center text-gray-700 text-xl font-bold mb-2">
                  ⏳ Result Pending
                </div>
              ) : resultStatus === "won" ? (
                <div className="flex justify-center items-center text-green-600 text-xl font-bold mb-2">
                  🎉 You Won!
                </div>
              ) : (
                <div className="flex justify-center items-center text-red-600 text-xl font-bold mb-2">
                  💔 You Lost
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Winners Section */}
      <h2 className="text-3xl font-bold mb-6 text-white text-center">Winners</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {winners.map((ticket, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-green-300 via-green-200 to-green-100 hover:scale-105 transform duration-200 ease-in-out"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-semibold text-gray-700">Number:</span> {ticket.number}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Type:</span> {getLotteryTypeLabel(ticket.type)}
              </div>
            </div>
            <div className="flex justify-center items-center text-green-700 text-xl font-bold">
              🏆 Winner!
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
