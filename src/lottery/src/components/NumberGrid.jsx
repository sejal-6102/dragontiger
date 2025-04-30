import React from "react";

const NumberGrid = ({ numbers, selected, setSelected, bookedNumbers }) => {
  const toggleNumber = (number) => {
    if (bookedNumbers.includes(number)) return;
    if (selected.includes(number)) {
      setSelected(selected.filter((n) => n !== number));
    } else {
      setSelected([...selected, number]);
    }
  };

  return (
    <div className="grid grid-cols-10 gap-2 p-4">
      {numbers.map((num) => (
        <div
          key={num}
          className={`p-2 rounded-md text-center cursor-pointer ${
            bookedNumbers.includes(num)
              ? "bg-red-400"
              : selected.includes(num)
              ? "bg-yellow-300"
              : "bg-green-300"
          }`}
          onClick={() => toggleNumber(num)}
        >
          {num}
        </div>
      ))}
    </div>
  );
};

export default NumberGrid;
