"use client";
import React from "react";
import Lottie from "lottie-react";
import animationData from "../Lotties/LogoAnimation.json";

export default function Animation({ onAnimationComplete }) {
  return (
    <div className="w-screen h-screen flex items-center justify-center overflow-hidden bg-white">
      <Lottie 
        animationData={animationData} 
        loop={false} 
        autoplay={true}
        onComplete={onAnimationComplete}
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice',
          clearCanvas: false,
          progressiveLoad: true
        }}
      />
    </div>
  );
}