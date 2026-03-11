// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-[#E5E7EB] bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-xs tracking-widest text-[#6B7280] font-medium uppercase">
          STILLBID
        </div>
        <div className="text-xs text-[#E5E7EB] font-light">
          Bid. Win. Own.
        </div>
        <div className="text-xs text-[#6B7280] flex items-center">
          Built on Somnia 
          <a 
            href="https://somnia.network" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#6B7280] hover:text-[#111111] ml-1 transition-colors"
          >
            [network]
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
