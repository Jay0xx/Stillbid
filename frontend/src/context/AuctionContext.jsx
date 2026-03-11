import React, { createContext, useState, useContext } from 'react';

const AuctionContext = createContext();

export const AuctionProvider = ({ children }) => {
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);

  const value = {
    activeAuctions,
    setActiveAuctions,
    selectedAuction,
    setSelectedAuction,
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuctions = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuctions must be used within an AuctionProvider');
  }
  return context;
};
