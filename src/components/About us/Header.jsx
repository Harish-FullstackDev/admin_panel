import React from "react";
import ContentHeader from "@/components/CommonComponents/ContentHeader";
import bg from "../../assets/aboutus/AboutPageBanner.svg";

const AboutHeader = () => {
  return (
    <>
      <ContentHeader
        backgroundImage={bg}
        subtitle="Empowering businesses with intelligent solutions."
        title="Your Partner for <br/>
Enterprise Transformation"
        description="Support Studio Technologies (SST) is a global SAP-certified partner delivering scalable Enterprise solutions that streamline operations, enable innovation, and drive sustainable growth."
      />
    </>
  );
};

export default AboutHeader;
