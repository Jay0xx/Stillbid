// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {
  return (
    <nav className="h-[64px] bg-white border-b border-auction-border px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="tracking-widest font-bold text-sm text-[#111111] uppercase">
          STILLBID
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-auction-muted hover:text-auction-accent transition-colors">
            Home
          </Link>
          <Link to="/create" className="text-sm font-medium text-auction-muted hover:text-auction-accent transition-colors">
            Create
          </Link>
          <Link to="/dashboard" className="text-sm font-medium text-auction-muted hover:text-auction-accent transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </div>
    </nav>
  );
};

export default Navbar;
