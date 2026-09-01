import React from "react";

const BottomArrowCard = () => {
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

      <style jsx>{`
        .profile-card {
          --black: 0, 0%, 0%;
          --white: 0, 0%, 100%;
          --black-muted: 0, 0%, 13%;
          --white-smoke: 0, 0%, 96%;
          --green-light: 87, 73%, 63%;
          --gap-action: 6px;
          --sz-action: 58px;
          --w-card: 330px;
          --h-card: 280px;
          --p-card: 1rem;
          --round-card: calc(
            var(--sz-action) / 2 + calc(var(--gap-action) / 2)
          );

          width: var(--w-card);
          height: var(--h-card);
          border-radius: var(--round-card);
          position: relative;
          background-color: var(--color-boxes, hsl(var(--green-light)));
          padding: var(--p-card);
          box-shadow: rgba(0, 0, 0, 0.15) -1.95px 1.95px 2.6px;
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
          bottom: 0;
          background-color: hsl(var(--white-smoke));
          z-index: 2;
          border-top-left-radius: var(--round-card);
          padding-top: var(--gap-action);
          padding-left: var(--gap-action);
          gap: var(--gap-action);
        }

        .corner i[data-corner] {
          position: absolute;
          width: 50%;
          height: 50%;
          z-index: 2;
          background-color: hsl(var(--white-smoke));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .corner i[data-corner]::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-bottom-right-radius: var(--round-card);
          background-color: var(--color-boxes, hsl(var(--green-light)));
          z-index: -1;
        }

        .corner i[data-corner="tl"] {
          bottom: 0;
          right: 100%;
        }

        .corner i[data-corner="br"] {
          right: 0;
          bottom: 100%;
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
          background-color: hsl(var(--white-smoke));
          color: hsl(var(--black-muted));
          box-shadow: rgba(0, 0, 0, 0.02) 0px 1px 3px 0px,
            rgba(27, 31, 35, 0.15) 0px 0px 0px 1px,
            rgba(0, 0, 0, 0.07) 0px 1px 2px, rgba(0, 0, 0, 0.07) 0px 2px 4px;
        }

        .corner .action:hover {
          background: hsl(var(--green-light));
        }

        .corner .action svg {
          width: 32px;
          height: 32px;
        }

        .corner .action:hover svg {
          color: white;
        }
      `}</style>
    </div>
  );
};

export default BottomArrowCard;