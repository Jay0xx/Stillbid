import hre from "hardhat";

async function main() {
  console.log("Starting deployment to Somnia Testnet...");

  // 1. Deploy MockNFT
  const MockNFT = await hre.ethers.getContractFactory("MockNFT");
  const mockNFT = await MockNFT.deploy();
  await mockNFT.waitForDeployment();
  const mockNFTAddress = await mockNFT.getAddress();
  console.log(`MockNFT deployed to: ${mockNFTAddress}`);

  // 2. Deploy AuctionHouse
  const AuctionHouse = await hre.ethers.getContractFactory("AuctionHouse");
  const auctionHouse = await AuctionHouse.deploy();
  await auctionHouse.waitForDeployment();
  const auctionHouseAddress = await auctionHouse.getAddress();
  console.log(`AuctionHouse deployed to: ${auctionHouseAddress}`);

  // 3. Deploy ReactiveSettlement
  const ReactiveSettlement = await hre.ethers.getContractFactory("ReactiveSettlement");
  const reactiveSettlement = await ReactiveSettlement.deploy(auctionHouseAddress);
  await reactiveSettlement.waitForDeployment();
  const reactiveSettlementAddress = await reactiveSettlement.getAddress();
  console.log(`ReactiveSettlement deployed to: ${reactiveSettlementAddress}`);

  console.log("\nDeployment complete!");
  console.log("-------------------");
  console.log(`MockNFT: ${mockNFTAddress}`);
  console.log(`AuctionHouse: ${auctionHouseAddress}`);
  console.log(`ReactiveSettlement: ${reactiveSettlementAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
