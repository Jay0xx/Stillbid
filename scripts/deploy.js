// scripts/deploy.js
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", 
    (await hre.ethers.provider.getBalance(
      deployer.address
    )).toString()
  );

  console.log("\nDeploying MockNFT...");
  const MockNFT = await hre.ethers.getContractFactory(
    "MockNFT"
  );
  const mockNFT = await MockNFT.deploy();
  await mockNFT.waitForDeployment();
  const mockNFTAddress = await mockNFT.getAddress();
  console.log("MockNFT:", mockNFTAddress);

  console.log("\nDeploying AuctionHouse...");
  const AuctionHouse = await hre.ethers.getContractFactory(
    "AuctionHouse"
  );
  const auctionHouse = await AuctionHouse.deploy();
  await auctionHouse.waitForDeployment();
  const auctionHouseAddress = await auctionHouse.getAddress();
  console.log("AuctionHouse:", auctionHouseAddress);

  console.log("\nDeploying ReactiveSettlement...");
  const ReactiveSettlement = 
    await hre.ethers.getContractFactory(
      "ReactiveSettlement"
    );
  // Passing auctionHouseAddress to ReactiveSettlement constructor
  const reactiveSettlement = 
    await ReactiveSettlement.deploy(auctionHouseAddress);
  await reactiveSettlement.waitForDeployment();
  const reactiveAddress = 
    await reactiveSettlement.getAddress();
  console.log("ReactiveSettlement:", reactiveAddress);

  console.log("\n=============================");
  console.log("COPY THESE TO contracts.js:");
  console.log("=============================");
  console.log(
    `MOCK_NFT_ADDRESS = "${mockNFTAddress}"`
  );
  console.log(
    `AUCTION_HOUSE_ADDRESS = "${auctionHouseAddress}"`
  );
  console.log(
    `REACTIVE_SETTLEMENT_ADDRESS = "${reactiveAddress}"`
  );

  // Verify auctionCounter works immediately
  console.log("\nVerifying AuctionHouse...")
  const counter = await auctionHouse.auctionCounter()
  console.log("auctionCounter:", counter.toString())
  if (counter.toString() === "1") {
    console.log("✅ AuctionHouse verified working")
  } else {
    console.log("❌ AuctionHouse verification failed")
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
