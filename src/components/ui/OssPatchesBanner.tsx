'use client';

export default function OssPatchesBanner() {
  const items = Array(60).fill('OssPatches');

  return (
    <div className="w-full bg-black overflow-hidden py-3 border-b-2 border-orange-600">
      <style>{`
        @keyframes scrolling {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .scroll-container {
          display: flex;
          animation: scrolling 80s linear infinite;
          width: 200%;
        }

        .scroll-item {
          white-space: nowrap;
          margin-right: 50px;
          font-size: 24px;
          font-weight: 900;
          color: #f97316;
          letter-spacing: 3px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="scroll-container">
        {items.map((item, i) => (
          <span key={i} className="scroll-item">
            {item}
          </span>
        ))}
        {items.map((item, i) => (
          <span key={`duplicate-${i}`} className="scroll-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
