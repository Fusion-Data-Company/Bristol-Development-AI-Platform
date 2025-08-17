import { cn } from "@/lib/utils";
import { useState } from "react";

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="pl">
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__dot"></div>
      <div className="pl__text">Loading…</div>
    </div>
  );
};