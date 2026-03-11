import { ethers } from "ethers";
import "dotenv/config";

async function main() {
    const provider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Address: ${wallet.address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} STT`);
}

main().catch(console.error);
