import React from "react";
import WhatRiseWithSAP from "./WhatRiseWithSAP";
import OurkeyDifferentiators from "./OurkeyDifferentiators";
import SAPToday from "./SAPToday";
import Footer from "@/components/Footer/Footer";
import Header from "./Header";
import EmpowerSAP from "./EmpowerSAP";

const RiseWithSAP = () => {
  return (
    <div>
      <Header />
      <EmpowerSAP />
      <WhatRiseWithSAP />
      <OurkeyDifferentiators />
      <SAPToday />
      <Footer />
    </div>
  );
};

export default RiseWithSAP;
