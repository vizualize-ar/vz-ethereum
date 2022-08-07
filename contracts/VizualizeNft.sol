// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// import "hardhat/console.sol";

// import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "./rarible/tokens/contracts/erc-1155/ERC1155Lazy.sol";
// import "./openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./rarible/tokens/contracts/erc-1155/ERC1155Rarible.sol";
// import "./openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";

// contract VizualizeNft is ERC1155Lazy, PausableUpgradeable, OwnableUpgradeable, ERC1155SupplyUpgradeable {
contract VizualizeNft is ERC1155Rarible, PausableUpgradeable {
    using StringsUpgradeable for uint256;

    //configuration
    string public baseExtension;

    //set the cost to mint each NFT
    uint256 public cost;

    //set the max supply of NFT's
    uint256 public maxSupply;

    //set the maximum number an address can mint at a time
    uint256 public maxMintAmount;

    // // function initialize(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) external initializer {
    // function initialize() public initializer {
    //     // __ERC1155RaribleUser_init(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
    //     // __Ownable_init();
    //     __Pausable_init();
    // }

    function initialize(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address transferProxy, address lazyTransferProxy) public initializer {
        __ERC1155Rarible_init_unchained(_name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
        for(uint i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }

        isPrivate = true;
        emit CreateERC1155RaribleUser(_msgSender(), _name, _symbol);
    }

    // function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Lazy, ERC1155Upgradeable) returns (bool) {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // function mint(
    //     LibERC1155LazyMint.Mint1155Data memory data,
    //     address recipient,
    //     uint256 mintAmount
    // ) public payable whenNotPaused {
    //     uint256 supply = totalSupply(data.tokenId);
    //     // require(!paused);
    //     require(mintAmount > 0);
    //     require(mintAmount <= maxMintAmount);
    //     require(supply + mintAmount <= maxSupply);

    //     if (msg.sender != owner()) {
    //         require(msg.value >= cost * mintAmount);
    //     }

    //     for (uint256 i = 1; i <= mintAmount; i++) {
    //         _mint(recipient, supply + i, mintAmount, "");
    //     }
    // }

    function pause(bool state) public onlyOwner {
        if (state) {
            _pause();
        } else {
            _unpause();
        }
    }

    // function setBaseURI(string memory newBaseURI) public {
    //     _setBaseURI(newBaseURI);
    // }

    function setBaseTokenURI(uint256 tokenId, string memory newBaseURI) public {
        _setTokenURI(tokenId, newBaseURI);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155Upgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    // function _mint(address account, uint256 id, uint256 amount, bytes memory data) internal virtual override(ERC1155Lazy, ERC1155Upgradeable) {
    //     super._mint(account, id, amount, data);
    // }

    // function uri(uint id) public view override(ERC1155BaseURI, ERC1155Upgradeable) virtual returns (string memory) {
    //     return _tokenURI(id);
    // }
}
