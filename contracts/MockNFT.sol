// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MockNFT is ERC721URIStorage {
    uint256 public tokenCounter;

    constructor() ERC721("MockNFT", "MNFT") {
        tokenCounter = 0;
    }

    /**
     * @dev Mints a new NFT with a specific tokenURI.
     * @param to The address that will receive the minted NFT.
     * @param _tokenURI The metadata URI for the token.
     * @return The ID of the newly minted token.
     */
    function mint(address to, string memory _tokenURI) public returns (uint256) {
        tokenCounter += 1;
        uint256 newTokenId = tokenCounter;
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        
        return newTokenId;
    }
}
