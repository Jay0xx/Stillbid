// src/config/wagmi.js
import { getDefaultConfig, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: { name: 'Somnia', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 0,
    },
  },
};

export const config = getDefaultConfig({
  appName: 'Stillbid',
  projectId: '04f8b20e20d97e52df45f1e84e8a7063', // WalletConnect public demo project ID - replace with your own at https://cloud.walletconnect.com
  chains: [somniaTestnet],
  transports: {
    [somniaTestnet.id]: http(),
  },
  ssr: false,
  connectOnMount: false,
});

export const queryClient = new QueryClient();

export const rainbowKitTheme = lightTheme({
  accentColor: '#111111',
  accentColorForeground: 'white',
  borderRadius: 'medium',
});
