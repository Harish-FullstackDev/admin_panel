import React from "react";
import AnimatedCard from "./AnimatedCard";
import Header from "./Header";
import MarqueeCard from "./MarqueeCard";
import Optimization from "./Optimization";
import Research from "./Research";
import Footer from "../Footer/Footer";

function Solution() {
  return (
    <div>
      <Header />
      <AnimatedCard />
      <MarqueeCard />
      <Optimization />
      <Research />
      <Footer />
    </div>
  );
}

export default Solution;
