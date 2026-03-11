// src/utils/errors.js
import { SOMNIA_EXPLORER_URL } from '../config/contracts';

export const parseContractError = (error) => {
  if (!error) return "Transaction failed. Please try again.";

  const message = (
    error.cause?.reason || 
    error.shortMessage || 
    error.message || 
    ""
  ).toLowerCase();

  if (message.includes("auction not active")) return "This auction is no longer active.";
  if (message.includes("bid too low")) return "Your bid must be at least 5% higher than the current bid.";
  if (message.includes("auction ended") || message.includes("auction expired")) return "This auction has already ended.";
  if (message.includes("not seller")) return "Only the seller can perform this action.";
  if (message.includes("already settled")) return "This auction has already been settled.";
  if (message.includes("has bids") || message.includes("cannot cancel with bids")) return "Cannot cancel an auction that has received bids.";
  if (message.includes("reserve not met")) return "The reserve price has not been met.";
  if (message.includes("user rejected") || message.includes("action_rejected")) return "Transaction cancelled.";
  if (message.includes("insufficient funds")) return "Insufficient STT balance for this bid.";

  return "Transaction failed. Please try again.";
};

export const isUserRejection = (error) => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || "";
  const code = error.code;
  return message.includes("user rejected") || code === 'ACTION_REJECTED' || code === 4001;
};

export const formatTxHash = (hash) => {
  if (!hash) return "—";
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
};

export const getTxExplorerUrl = (hash) => {
  return `${SOMNIA_EXPLORER_URL}/tx/${hash}`;
};

export const getAddressExplorerUrl = (address) => {
  return `${SOMNIA_EXPLORER_URL}/address/${address}`;
};
