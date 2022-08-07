// import { network } from 'hardhat';
import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContract, getEnvVariable, getProvider, getSignature, creators, getAccount } from "./helpers";

import { VizualizeNft } from "../typechain-types";
import { LibERC1155LazyMint } from "../typechain-types/contracts/VizualizeNft";
import { ethers, Wallet } from "ethers";

const zeroWord =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// task("mint", "Mints from the NFT contract")
//   .setAction(async () => { });

task("mint", "Mints from the NFT contract")
  .addParam("address", "The address to receive a token")
  .setAction(async function (taskArguments, hre) {
    const token: VizualizeNft = (await getContract(
      "VizualizeNft",
      hre
    )) as VizualizeNft;

		const tokenOwner = getAccount();
    console.log("mint: token owner %s", tokenOwner.address);
    let minter = tokenOwner;
    let transferTo = taskArguments.address; // "0x294FD38352221768AaCca0918c932648ba2Ce98A";

    const tokenId = minter.address + "b00000000000000000000004";
    // const tokenURI = "/bafkreibqvfud34agqhtavreqysakyem7yqgwojt4tzwjv6qqustoif45xq";
    // const tokenURI = "bafkreibqvfud34agqhtavreqysakyem7yqgwojt4tzwjv6qqustoif45xq.ipfs.nftstorage.link";
    const tokenURI = "bafybeidevdmbujehotzwzdwspiuqqy7uzs7w5wlgw6ninuix7fbegiqnce.ipfs.nftstorage.link/metadata/data.json";
    let supply = 1;
    let mint = 1;

    console.log("minting. tokenId %s", tokenId);
    const signature = await getSignature(token, tokenId, tokenURI, supply, creators([minter]), [], minter);
    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [signature] };
    try {
      const tx = await token.mintAndTransfer(data, transferTo, mint,
        {
          from: tokenOwner.address,
          gasLimit: 500_000,
          nonce: undefined
        });
      console.log(`Transaction Hash: ${tx.hash}`);
    } catch(e) {
      console.log("Error sending tx: ", e);
    }
  });

task("set-base-uri", "Sets the baseURI in the contract")
  .addParam("baseuri", "The new baseURI to set in the contract")
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;
    const tx = await contract.setBaseURI(taskArguments.baseuri);
    console.log("Transaction hash %s", tx.hash);
  });

task("token-uri", "Fetches the token metadata for the given token ID")
  .addParam("tokenid", "The tokenID to fetch metadata for")
  .setAction(async function (taskArguments, hre) {
      const contract = await getContract("VizualizeNft", hre) as VizualizeNft;
      console.log("Metadata for %s", taskArguments.tokenid)
      const response = await contract.uri(taskArguments.tokenid, {
          gasLimit: 500_000,
      });
      
      const metadata_url = response;
      console.log(`Metadata URL: ${metadata_url}`);
  
      // const metadata = await fetch(metadata_url).then(res => res.json());
      // console.log(`Metadata fetch response: ${JSON.stringify(metadata, null, 2)}`);
  });