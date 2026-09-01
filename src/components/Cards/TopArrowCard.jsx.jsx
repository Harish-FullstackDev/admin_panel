import React from "react";

const TopArrowCard = () => {
  return (
    <div className="profile-card">
      <div className="corner">
        <i data-corner="tl"></i>
        <i data-corner="br"></i>

        <div data-action="more" className="action">
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17 7l-11 11" />
            <path d="M8 7l9 0l0 9" />
          </svg>
        </div>
      </div>

      <div className="box-body"></div>

      <style jsx>{`
        .profile-card {
          --gap: 12px;
          --w-card: 330px;
          --h-card: 280px;
          --p-card: 1rem;
          --gap-action: 6px;
          --sz-action: 58px;
          --round-card: calc(
            var(--sz-action) / 2 + calc(var(--gap-action) / 2)
          );

          
          width: var(--w-card);
          height: var(--h-card);
          border-radius: var(--round-card);
          position: relative;
          /* Updated for transparency and frosted effect */
          background-color: white; /* 10% opaque white */
          border: 1px solid rgb(231,233,235); /* Subtle white border */
          padding: var(--p-card);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          
        }


        .corner {
          position: absolute;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          height: auto;
          right: 0;
          top: 0;
          background-color: white;
          z-index: 2;
          border-bottom-left-radius: var(--round-card);
          border: 1px solid rgb(231,233,235); /* Subtle white border */
          padding-bottom: var(--gap-action);
          padding-left: var(--gap-action);
          gap: var(--gap-action);
        }

        .corner i[data-corner] {
          position: absolute;
          width: 50%;
          height: 50%;
          z-index: 2;
          background-color: white;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .corner i[data-corner]::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
border-top: 1px solid rgb(231,233,235);
border-right: 1px solid rgb(231,233,235);

          border-top-right-radius: var(--round-card);
          background-color: white;
          z-index: -1;
        }

        .corner i[data-corner="tl"] {
          top: 0;
          right: 100%;
        }

        .corner i[data-corner="br"] {
          right: 0;
          top: 100%;
        }

        .corner .action {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          height: var(--sz-action);
          min-height: var(--sz-action);
          max-height: var(--sz-action);
          width: var(--sz-action);
          min-width: var(--sz-action);
          max-width: var(--sz-action);
          border: none;
          outline: none;
          transition: all 0.5s ease;
          background-color: white;
          color: hsl(0, 0%, 13%);
          box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px,
            rgba(27, 31, 35, 0.15) 0px 0px 0px 1px,
            rgba(0, 0, 0, 0.07) 0px 1px 2px, rgba(0, 0, 0, 0.07) 0px 2px 4px;
        }

        .corner .action:hover {
          background: hsl(87, 73%, 63%);
        }

        .corner .action svg {
          width: 32px;
          height: 32px;
        }

        .corner .action:hover svg {
          color: white;
        }

        .box-body {
          gap: 16px;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 9;
        }
      `}</style>
    </div>
  );
};

export default TopArrowCard;