// contracts/AuctionHouse.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionHouse is ReentrancyGuard, Ownable {
    struct Auction {
        uint256 auctionId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 reservePrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 startTime;
        uint256 endTime;
        bool settled;
        bool active;
    }

    uint256 public auctionCounter = 1;
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    uint256 public constant BPS_DIVISOR = 10000;

    mapping(uint256 => Auction) public auctions;

    event AuctionCreated(
        uint256 indexed auctionId,
        address nftContract,
        uint256 tokenId,
        address indexed seller,
        uint256 reservePrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount
    );

    event AuctionCancelled(
        uint256 indexed auctionId
    );

    constructor() Ownable(msg.sender) {}

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 reservePrice,
        uint256 durationInSeconds
    ) external {
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        uint256 auctionId = auctionCounter++;
        uint256 endTime = block.timestamp + durationInSeconds;

        auctions[auctionId] = Auction({
            auctionId: auctionId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            reservePrice: reservePrice,
            highestBid: 0,
            highestBidder: payable(address(0)),
            startTime: block.timestamp,
            endTime: endTime,
            settled: false,
            active: true
        });

        Auction storage auction = auctions[auctionId];
        emit AuctionCreated(
            uint256(auction.auctionId),
            auction.nftContract,
            uint256(auction.tokenId),
            auction.seller,
            uint256(auction.reservePrice),
            uint256(auction.endTime)
        );
    }

    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction expired");
        
        uint256 minBid = auction.highestBid == 0 
            ? auction.reservePrice 
            : auction.highestBid + (auction.highestBid * 500 / 10000); // 5% increase

        require(msg.value >= minBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            auction.highestBidder.transfer(auction.highestBid);
        }

        auction.highestBid = msg.value;
        auction.highestBidder = payable(msg.sender);

        emit BidPlaced(
            uint256(auctionId),
            msg.sender,
            uint256(msg.value)
        );
    }

    function settleAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Auction already settled");

        auction.settled = true;
        auction.active = false;

        if (auction.highestBidder != address(0)) {
            uint256 platformFee = (auction.highestBid * PLATFORM_FEE_BPS) / BPS_DIVISOR;
            uint256 sellerProceeds = auction.highestBid - platformFee;

            payable(owner()).transfer(platformFee);
            auction.seller.transfer(sellerProceeds);

            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);
            emit AuctionSettled(
                uint256(auctionId),
                auction.highestBidder,
                uint256(auction.highestBid)
            );
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionSettled(
                uint256(auctionId),
                address(0),
                uint256(0)
            );
        }
    }

    function cancelAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.seller, "Only seller can cancel");
        require(auction.highestBid == 0, "Cannot cancel with bids");
        require(auction.active, "Auction not active");

        auction.active = false;
        IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);

        emit AuctionCancelled(uint256(auctionId));
    }

    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256 total = auctionCounter - 1;
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= total; i++) {
            if (auctions[i].active && block.timestamp < auctions[i].endTime) {
                activeCount++;
            }
        }

        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (auctions[i].active && block.timestamp < auctions[i].endTime) {
                activeIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeIds;
    }
}
