// SPDX-License-Identifier: MIT

// pragma solidity 0.7.6;
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "../../../lib-signature/contracts/ERC1271.sol";
import "../../../lib-signature/contracts/LibSignature.sol";

import "hardhat/console.sol";

abstract contract ERC1271Validator is EIP712Upgradeable {
    using AddressUpgradeable for address;
    using LibSignature for bytes32;

    string constant SIGNATURE_ERROR = "signature verification error";
    bytes4 constant internal MAGICVALUE = 0x1626ba7e;

    function validate1271(address signer, bytes32 structHash, bytes memory signature) internal view {
        bytes32 hash = _hashTypedDataV4(structHash);

        address signerFromSig;
        if (signature.length == 65) {
            console.log("ERC1271Validator: signature length 65");
            signerFromSig = hash.recover(signature);
        }
        if  (signerFromSig != signer) {
            console.log("ERC1271Validator: signature not from signer %s, signerFromSig %s", signer, signerFromSig);
            if (signer.isContract()) {
                console.log("ERC1271Validator: singer is contract");
                require(
                    ERC1271(signer).isValidSignature(hash, signature) == MAGICVALUE,
                    SIGNATURE_ERROR
                );
            } else {
                console.log("ERC1271Validator: signer not contract");
                revert(SIGNATURE_ERROR);
            }
        }
    }
    uint256[50] private __gap;
}
