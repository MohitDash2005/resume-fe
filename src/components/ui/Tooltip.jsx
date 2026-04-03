import { useState } from "react";

const Tooltip = ({ text, children, position = "top" }) => {
  const [show, setShow] = useState(false);
  const pos = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 ${pos} px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200 whitespace-nowrap shadow-xl pointer-events-none animate-fade-in`}>
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
