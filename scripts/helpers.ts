import { ethers, Wallet } from "ethers";
import { getContractAt } from "@nomiclabs/hardhat-ethers/internal/helpers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { createTypeData, signTypedData } from "./EIP712";
import { VizualizeNft } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AlchemyProvider } from "@ethersproject/providers";

// Helper method for fetching environment variables from .env
function getEnvVariable(key: string, defaultValue?: string): any {
  if (process.env[key]) {
    return process.env[key];
  }
  if (!defaultValue) {
    throw `${key} is not defined and no default value was provided`;
  }
  return defaultValue;
}

// Helper method for fetching a connection provider to the Ethereum network
function getProvider() {
//   return ethers.getDefaultProvider(getEnvVariable("NETWORK", "rinkeby"), {
//     alchemy: getEnvVariable("ALCHEMY_KEY"),
//   });
    return new AlchemyProvider(getEnvVariable("NETWORK", "rinkeby"), getEnvVariable("ALCHEMY_KEY"));
}

// Helper method for fetching a wallet account using an environment variable for the PK
function getAccount() {
  return new ethers.Wallet(
    getEnvVariable("ACCOUNT_PRIVATE_KEY"),
    getProvider()
  );
}

// Helper method for fetching a contract instance at a given address
function getContract(contractName: string, hre: HardhatRuntimeEnvironment) {
  const account = getAccount();
  return getContractAt(
    hre,
    contractName,
    getEnvVariable("NFT_CONTRACT_ADDRESS"),
    account
  );
}

export const Types = {
  Part: [
    { name: "account", type: "address" },
    { name: "value", type: "uint96" },
  ],
  Mint1155: [
    { name: "tokenId", type: "uint256" },
    { name: "supply", type: "uint256" },
    { name: "tokenURI", type: "string" },
    { name: "creators", type: "Part[]" },
    { name: "royalties", type: "Part[]" },
  ],
};

// async function sign(
//   chainId: any,
//   account: any,
//   tokenId: any,
//   tokenURI: any,
//   supply: any,
//   creators: any,
//   royalties: any,
//   verifyingContract: any
// ) {
//   const data = createTypeData(
//     {
//       name: "Mint1155",
//       version: "1",
//       chainId,
//       verifyingContract,
//     },
//     "Mint1155",
//     { tokenId, supply, tokenURI, creators, royalties },
//     Types
//   );
//   return (await signTypedData(account, data)).sig;
// }

async function getSignature(
  token: VizualizeNft,
  tokenId: any,
  tokenURI: any,
  supply: any,
  creators: any,
  royalties: any,
  minter: SignerWithAddress | Wallet
) {
  // const chainId = ethers.provider.network.chainId; // ethers.getDefaultProvider().network.chainId;
  const chainId = (await token.provider.getNetwork()).chainId;
  // console.log("getSignature. chainId %s, tokenOwner: %s", chainId, tokenOwner.address);
  const domain = {
    name: "Mint1155",
    version: "1",
    chainId,
    verifyingContract: token.address,
  };

  // The named list of all type definitions
  const types = Types;

  // The data to sign
  const value = { tokenId, supply, tokenURI, creators, royalties };

  // console.log("getSignature. value: %s", JSON.stringify(value));

  const signature = await minter._signTypedData(domain, types, value);
  return signature;
}

function creators(list: any[]) {
  const value = 10000 / list.length;
  return list.map((account: any) => ({ account: account.address, value }));
}

export {
  getEnvVariable,
  getProvider,
  getAccount,
  getContract,
  // sign,
  getSignature,
  creators
};
