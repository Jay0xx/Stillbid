// scripts/deploy.js
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", 
    (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy MockNFT
  console.log("\n--- Deploying MockNFT ---");
  const MockNFT = await hre.ethers.getContractFactory("MockNFT");
  const mockNFT = await MockNFT.deploy();
  await mockNFT.waitForDeployment();
  const mockNFTAddress = await mockNFT.getAddress();
  console.log("MockNFT deployed to:", mockNFTAddress);

  // Deploy AuctionHouse
  console.log("\n--- Deploying AuctionHouse ---");
  const AuctionHouse = await hre.ethers.getContractFactory("AuctionHouse");
  const auctionHouse = await AuctionHouse.deploy();
  await auctionHouse.waitForDeployment();
  const auctionHouseAddress = await auctionHouse.getAddress();
  console.log("AuctionHouse deployed to:", auctionHouseAddress);

  // Deploy ReactiveSettlement
  console.log("\n--- Deploying ReactiveSettlement ---");
  const ReactiveSettlement = await hre.ethers.getContractFactory("ReactiveSettlement");
  const reactiveSettlement = await ReactiveSettlement.deploy(auctionHouseAddress);
  await reactiveSettlement.waitForDeployment();
  const reactiveSettlementAddress = await reactiveSettlement.getAddress();
  console.log("ReactiveSettlement deployed to:", reactiveSettlementAddress);

  // Print summary
  console.log("\n=============================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("=============================");
  console.log("MockNFT:            ", mockNFTAddress);
  console.log("AuctionHouse:       ", auctionHouseAddress);
  console.log("ReactiveSettlement: ", reactiveSettlementAddress);
  console.log("=============================");
  console.log("\nUpdate frontend/src/config/contracts.js with:");
  console.log(`export const MOCK_NFT_ADDRESS = "${mockNFTAddress}";`);
  console.log(`export const AUCTION_HOUSE_ADDRESS = "${auctionHouseAddress}";`);
  console.log(`export const REACTIVE_SETTLEMENT_ADDRESS = "${reactiveSettlementAddress}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
