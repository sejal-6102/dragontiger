import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center justify-center h-screen gap-10"
      style={{
        backgroundColor: "rgb(141, 9, 9)", // Red background
        color: "#fff", // Ensuring the text color is white for contrast
      }}
    >
      <h1 className="text-4xl font-bold mb-4 text-white text-center">
        Welcome to Lottery
      </h1>

      {/* Play 1-500 button */}
      <button
        onClick={() => navigate("/select/1")}
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg hover:scale-105 transform transition duration-300"
      >
        Play 1–500 (10x Return)
      </button>

      {/* Play 501-2500 button */}
      <button
        onClick={() => navigate("/select/2")}
        className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-lg hover:scale-105 transform transition duration-300"
      >
        Play 501–2500 (Fixed Prizes)
      </button>
    </div>
  );
}
