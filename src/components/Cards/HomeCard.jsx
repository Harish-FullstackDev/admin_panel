import React from "react";

const HomeCard = ({ icon, index, title, desc }) => {
  return (
     <>
      <style>{`
        .card {
          width: 100%;
          max-width: 300px;
          min-width: 250px;
          border-radius: none;
          padding: 0;
          overflow: hidden;
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: none;
          // background: #060809;
          cursor: pointer;
        }

   
        .card .top-section {
          height: clamp(180px, 40vw, 220px);
          border-radius: clamp(20px, 5vw, 25px);
          display: flex;
          flex-direction: column;
          background: white;
          position: relative;
border-top: 2px solid black;
border-left: 1px solid black;
border-right: none;
border-bottom: none;
        }

        .card .top-section .border {
          border-bottom-right-radius: 10px;
          height: 30px;
          width: 130px;
          background: #000000;
          position: relative;
          transform: skew(-40deg);
          box-shadow: -5px -1px 0 1px #000000;
          border: none;
        }

        .card .top-section .border::before {
          content: "";
          position: absolute;
          width: 15px;
          height: 15px;
          top: 0px;
          right: -15px;
          border-top-left-radius: 50px;
          box-shadow: -5px -5px 0 2px #000000;
          border: none;
        }

        .card .top-section::before {
          content: "";
          position: absolute;
          top: 30px;
          left: 0;
          width: 15px;
          height: 15px;
          border-top-left-radius: 15px;
          box-shadow: -5px -5px 0 1px #000000;
          border: none;
        }

        .card .top-section .icons {
          position: absolute;
          top: 0;
          width: 100%;
          height: 30px;
          display: flex;
          justify-content: space-between;
          border: none;
        }

        .card .top-section .icons .logo {
          height: 100%;
          aspect-ratio: 1;
          padding: 7px 0 7px 15px;
          border: none;
        }

        .card .top-section .icons .social-media {
          height: 100%;
          padding: 8px 15px;
          display: flex;
          gap: 7px;
          border: none;
        }

        .card .content-section {
          padding: clamp(0.5rem, 2vw, 1rem);
          padding-left: clamp(1rem, 3vw, 1.50rem);
          padding-right: clamp(1rem, 3vw, 1.50rem);
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card .icon-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
          margin-right: 15px;
          width: 2rem;
          height: 2rem;
          color: #3b82f6;
          transition: color 0.2s ease-in-out;
          align-self: flex-end;
        }

        .card .icon-container:hover {
          color: #3b82f6;
        }

        .card .title {
          font-weight: bold;
          font-size: clamp(1rem, 4vw, 1.25rem);
          color: black;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
          line-height: 1.2;
        }

        .card .description {
          color: #4a5568;
          font-size: clamp(0.875rem, 3vw, 0.875rem);
          line-height: 1.4;
          flex: 1;
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .card {
            min-width: 200px;
            max-width: 280px;
          }
          
          .card .top-section .border {
            width: clamp(100px, 25vw, 130px);
          }
        }

        @media (max-width: 480px) {
          .card {
            min-width: 180px;
            max-width: 250px;
          }
        }
      `}</style>

      <div className="card">
        <div className="top-section">
          <div className="border"></div>
          <div className="icons">
            <div className="logo"></div>
            <div className="social-media"></div>
          </div>

          {/* Content Section */}
          <div className="content-section">
            <div className="icon-container">{icon}</div>
            <h3 className="title">{title}</h3>
            <p className="description">{desc}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeCard;