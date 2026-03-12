// contracts/AuctionHouse.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract AuctionHouse {

    // Inline reentrancy guard
    uint256 private _reentrancyStatus;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(
            _reentrancyStatus != _ENTERED, 
            "ReentrancyGuard: reentrant call"
        );
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    // Inline ownership
    address private _owner;

    modifier onlyOwner() {
        require(
            msg.sender == _owner, 
            "Not owner"
        );
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

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
    uint256 public constant PLATFORM_FEE_BPS = 250;
    uint256 public constant BPS_DIVISOR = 10000;

    mapping(uint256 => Auction) public auctions;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed nftContract,
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

    event AuctionForceEnded(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed refundedBidder,
        uint256 refundedAmount
    );

    event BidAccepted(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed buyer,
        uint256 amount
    );

    constructor() {
        _owner = msg.sender;
        _reentrancyStatus = _NOT_ENTERED;
    }

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 reservePrice,
        uint256 durationInSeconds
    ) external {
        IERC721(nftContract).transferFrom(
            msg.sender, 
            address(this), 
            tokenId
        );

        uint256 auctionId = auctionCounter++;
        uint256 endTime = block.timestamp + 
            durationInSeconds;

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

        emit AuctionCreated(
            auctionId,
            nftContract,
            tokenId,
            msg.sender,
            reservePrice,
            endTime
        );
    }

    function placeBid(
        uint256 auctionId
    ) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(
            block.timestamp < auction.endTime, 
            "Auction expired"
        );

        uint256 minBid = auction.highestBid == 0
            ? auction.reservePrice
            : auction.highestBid + 
              (auction.highestBid * 500 / 10000);

        require(msg.value >= minBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            auction.highestBidder.transfer(
                auction.highestBid
            );
        }

        auction.highestBid = msg.value;
        auction.highestBidder = payable(msg.sender);

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    function settleAuction(
        uint256 auctionId
    ) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(
            block.timestamp >= auction.endTime, 
            "Auction not ended"
        );
        require(!auction.settled, "Already settled");

        auction.settled = true;
        auction.active = false;

        if (auction.highestBidder != address(0)) {
            uint256 platformFee = 
                (auction.highestBid * PLATFORM_FEE_BPS) 
                / BPS_DIVISOR;
            uint256 sellerProceeds = 
                auction.highestBid - platformFee;

            payable(_owner).transfer(platformFee);
            auction.seller.transfer(sellerProceeds);

            IERC721(auction.nftContract)
                .safeTransferFrom(
                    address(this),
                    auction.highestBidder,
                    auction.tokenId
                );

            emit AuctionSettled(
                auctionId,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            IERC721(auction.nftContract)
                .safeTransferFrom(
                    address(this),
                    auction.seller,
                    auction.tokenId
                );

            emit AuctionSettled(auctionId, address(0), 0);
        }
    }

    function cancelAuction(
        uint256 auctionId
    ) external {
        Auction storage auction = auctions[auctionId];
        require(
            msg.sender == auction.seller, 
            "Only seller"
        );
        require(
            auction.highestBid == 0, 
            "Cannot cancel with bids"
        );
        require(auction.active, "Not active");

        auction.active = false;

        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        emit AuctionCancelled(auctionId);
    }

    function forceEndAuction(
        uint256 auctionId
    ) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(
            msg.sender == auction.seller, 
            "Only seller"
        );
        require(auction.active, "Not active");
        require(!auction.settled, "Already settled");
        require(
            auction.highestBid > 0, 
            "No bids, use cancelAuction"
        );

        address payable bidder = auction.highestBidder;
        uint256 refundAmount = auction.highestBid;

        auction.highestBid = 0;
        auction.highestBidder = payable(address(0));
        auction.active = false;
        auction.settled = true;

        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        bidder.transfer(refundAmount);

        emit AuctionForceEnded(
            auctionId,
            auction.seller,
            bidder,
            refundAmount
        );
    }

    function acceptBid(
        uint256 auctionId
    ) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(
            msg.sender == auction.seller,
            "Only seller"
        );
        require(auction.active, "Not active");
        require(!auction.settled, "Already settled");
        require(
            auction.highestBid > 0,
            "No bids to accept"
        );
        require(
            auction.highestBidder != address(0),
            "No bidder"
        );

        auction.settled = true;
        auction.active = false;

        uint256 platformFee = 
            (auction.highestBid * PLATFORM_FEE_BPS) 
            / BPS_DIVISOR;
        uint256 sellerProceeds = 
            auction.highestBid - platformFee;

        address buyer = auction.highestBidder;
        uint256 saleAmount = auction.highestBid;

        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            buyer,
            auction.tokenId
        );

        payable(_owner).transfer(platformFee);
        auction.seller.transfer(sellerProceeds);

        emit BidAccepted(
            auctionId,
            auction.seller,
            buyer,
            saleAmount
        );
    }

    function getAuction(
        uint256 auctionId
    ) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    function getActiveAuctions() 
        external view returns (uint256[] memory) {
        uint256 total = auctionCounter - 1;
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (auctions[i].active && 
                block.timestamp < auctions[i].endTime) {
                activeCount++;
            }
        }

        uint256[] memory activeIds = 
            new uint256[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (auctions[i].active && 
                block.timestamp < auctions[i].endTime) {
                activeIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return activeIds;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
