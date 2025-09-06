import React from "react";

export default function Gradient() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-[#05070b]" />
      <div
        className="absolute -inset-[18%] opacity-[0.32] will-change-transform animate-[bgfloat_130s_linear_infinite]"
        style={{
          background:
            "radial-gradient(60% 75% at 20% 18%, rgba(255,142,56,0.22) 0%, rgba(255,142,56,0) 60%), radial-gradient(65% 70% at 82% 24%, rgba(255,80,20,0.18) 0%, rgba(255,80,20,0) 62%)",
        }}
      />
      <div
        className="absolute -inset-[22%] opacity-[0.20] mix-blend-screen will-change-transform animate-[bgfloat2_180s_linear_infinite]"
        style={{
          background:
            "radial-gradient(48% 58% at 76% 78%, rgba(255,172,102,0.12) 0%, rgba(255,172,102,0) 58%), radial-gradient(42% 52% at 26% 76%, rgba(255,104,40,0.10) 0%, rgba(255,104,40,0) 58%)",
        }}
      />
      <style>{`
        @keyframes bgfloat {
          0%   { transform: translate3d(-2%, -1%, 0) scale(1.04); }
          50%  { transform: translate3d( 2%,  1%, 0) scale(1.08); }
          100% { transform: translate3d(-2%, -1%, 0) scale(1.04); }
        }
        @keyframes bgfloat2 {
          0%   { transform: translate3d( 2%, -1%, 0) scale(1.05) rotate(0.001turn); }
          50%  { transform: translate3d(-2%,  1%, 0) scale(1.07) rotate(0.01turn); }
          100% { transform: translate3d( 2%, -1%, 0) scale(1.05) rotate(0.001turn); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-[bgfloat_130s_linear_infinite],
          .animate-[bgfloat2_180s_linear_infinite] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
