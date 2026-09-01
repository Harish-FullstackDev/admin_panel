import React from "react";

const ProcessCard = ({ icon, index, title, desc }) => {
  return (
    <>
      <style>{`
        .processcontainer {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          flex-direction: column;
        }

        .processcard-wrapper {
          border-radius: 20px; /* rounded corners */
          overflow: hidden;    /* enforce rounded edges */
        }

        .processcard {
          position: relative;
          height: 180px;   
          width: 250px;
          background: rgba(0, 0, 0, 0.45);
          clip-path: polygon(
            100% 0%, 62% 0%, 45% 15%, 
            0% 15%, 0% 30%, 0% 60%, 
            0% 100%, 100% 100%, 40% 95%, 
            100% 100%, 100% 92%, 100% 70%, 
            100% 46%, 100% 25%
          );
        }
      `}</style>

      <div className="processcontainer">
        <div className="processcard-wrapper">
          <div className="processcard"></div>
        </div>
      </div>
    </>
  );
};

export default ProcessCard;
