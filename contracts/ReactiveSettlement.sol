// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReactive {
    function react(
        uint256 chainId,
        address _contract,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3,
        bytes calldata data,
        uint256 blockNumber,
        uint256 opCode
    ) external;
}

interface IAuctionHouse {
    function settleAuction(uint256 auctionId) external;
}

contract ReactiveSettlement is IReactive {
    struct BidRecord {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    address public immutable auctionHouse;
    address public immutable reactiveNetwork;

    mapping(uint256 => BidRecord) public latestBids;

    event ReactiveCallback(uint256 auctionId, address bidder, uint256 amount);
    event BidRecorded(uint256 auctionId, address bidder, uint256 amount, uint256 timestamp);

    constructor(address _auctionHouse) {
        auctionHouse = _auctionHouse;
        reactiveNetwork = msg.sender;
    }

    modifier onlyReactive() {
        require(msg.sender == reactiveNetwork || msg.sender == address(this), "Unauthorized caller");
        _;
    }

    function react(
        uint256 /* chainId */,
        address /* _contract */,
        uint256 topic0,
        uint256 topic1,
        uint256 /* topic2 */,
        uint256 /* topic3 */,
        bytes calldata data,
        uint256 /* blockNumber */,
        uint256 /* opCode */
    ) external override onlyReactive {
        // topic0: BidPlaced(uint256,address,uint256)
        if (topic0 == uint256(keccak256("BidPlaced(uint256,address,uint256)"))) {
            // topic1: auctionId
            uint256 auctionId = topic1;
            
            // Decodes data to extract bidder (address) and amount (uint256)
            (address bidder, uint256 amount) = abi.decode(data, (address, uint256));

            emit ReactiveCallback(auctionId, bidder, amount);
            recordBid(auctionId, bidder, amount);
        }
    }

    function recordBid(uint256 auctionId, address bidder, uint256 amount) public onlyReactive {
        latestBids[auctionId] = BidRecord({
            bidder: bidder,
            amount: amount,
            timestamp: block.timestamp
        });

        emit BidRecorded(auctionId, bidder, amount, block.timestamp);
    }

    function getLatestBid(uint256 auctionId) external view returns (BidRecord memory) {
        return latestBids[auctionId];
    }

    function triggerSettlement(uint256 auctionId) external {
        IAuctionHouse(auctionHouse).settleAuction(auctionId);
    }
}
