// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../../../royalties/contracts/LibRoyalties2981.sol";

contract TestRoyaltyV2981Calculate {
    function calculateRoyaltiesTest(address to, uint256 amount) external pure returns (LibPart.Part[] memory) {
        return LibRoyalties2981.calculateRoyalties(to, amount);
    }
}
