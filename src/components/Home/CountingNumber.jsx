import React, { useState, useEffect, useRef } from "react";

const CountingNumber = ({ end, duration , suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isCounting = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isCounting.current) {
          isCounting.current = true;
          let startTimestamp;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = timestamp - startTimestamp;
            const newCount = Math.min(
              end,
              Math.floor((progress / duration) * end)
            );
            setCount(newCount);
            if (newCount < end) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      {
        threshold: 0.5,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [end, duration]);

  return (
    <h2
      ref={ref}
      className="text-2xl md:text-2xl font-medium "
    >
      {count}
      {count === end ? suffix : ""}
    </h2>
  );
};

export default CountingNumber;