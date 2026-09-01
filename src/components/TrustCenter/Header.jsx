import React from "react";
import ContentHeader from "../CommonComponents/ContentHeader";

const Header = () => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="relative h-[75vh] w-full flex flex-col">
        <ContentHeader
          backgroundImage="/trustcenter/BackgroundImage.png"
          subtitle=""
          title="Built on Trust, Secured by Technology"
          description=" “We protect your enterprise with world-class security, compliance, and data governance so you can innovate without fear."
        />
      </div>
    </div>
  );
};

export default Header;
