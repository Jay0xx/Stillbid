// contracts/MockNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT is ERC721 {
    uint256 public tokenCounter;
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("StillbidNFT", "SNFT") {
        tokenCounter = 0;
    }

    function mint(
        address to,
        string memory uri
    ) external returns (uint256) {
        tokenCounter++;
        uint256 newTokenId = tokenCounter;
        _mint(to, newTokenId);
        _tokenURIs[newTokenId] = uri;
        return newTokenId;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "Token does not exist"
        );
        return _tokenURIs[tokenId];
    }
}
