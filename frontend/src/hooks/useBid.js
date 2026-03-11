// src/hooks/useBid.js
import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import { AUCTION_HOUSE_ADDRESS, AUCTION_HOUSE_ABI, SOMNIA_CHAIN_ID } from '../config/contracts';

export const useBid = (auctionId) => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ 
    address,
    chainId: SOMNIA_CHAIN_ID
  });

  const [txHash, setTxHash] = useState();

  const { writeContract, isPending, isError, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const placeBid = async (amountInSTT) => {
    if (!amountInSTT || isNaN(amountInSTT) || parseFloat(amountInSTT) <= 0) {
      throw new Error("Invalid bid amount");
    }

    const hash = await writeContract({
      address: AUCTION_HOUSE_ADDRESS,
      abi: AUCTION_HOUSE_ABI,
      functionName: 'placeBid',
      args: [BigInt(auctionId)],
      value: parseEther(amountInSTT),
    });

    setTxHash(hash);
  };

  return {
    placeBid,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    reset,
    userBalance: balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000",
    userBalanceRaw: balance?.value || 0n,
    txHash,
  };
};
