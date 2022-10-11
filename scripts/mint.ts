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
  .addParam("address", "The address to receive a token", undefined, undefined, true)
  .setAction(async function (taskArguments, hre) {
    const token: VizualizeNft = (await getContract(
      "VizualizeNft",
      hre
    )) as VizualizeNft;

		const tokenOwner = getAccount();
    console.log("mint: token owner %s", tokenOwner.address);
    let minter = tokenOwner;
    let transferTo = taskArguments.address || tokenOwner.address; // "0x294FD38352221768AaCca0918c932648ba2Ce98A";

    const tokenId = minter.address + "b00000000000000000000001";
    // const tokenURI = "/bafkreibqvfud34agqhtavreqysakyem7yqgwojt4tzwjv6qqustoif45xq";
    // const tokenURI = "bafkreibqvfud34agqhtavreqysakyem7yqgwojt4tzwjv6qqustoif45xq.ipfs.nftstorage.link";
    const tokenURI = "bafybeigrixvqvn2rdo3xgez3glnxt7r7wusyxgtoocugwi3xwrf7dvqy7u.ipfs.nftstorage.link/metadata/data.json";
    let supply = 1;
    let mint = 1;

    const royalties = [
      { account: tokenOwner.address, value: 300 } // 3%
    ];

    const signature = await getSignature(token, tokenId, tokenURI, supply, creators([minter]), [], minter);
    console.log("minting. tokenId %s, sig: %s", tokenId, signature);
    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties, signatures: [signature] };
    try {
      // const tx = await token.mintAndTransfer(data, transferTo, mint,
      //   {
      //     from: tokenOwner.address,
      //     gasLimit: 550_000,
      //     nonce: undefined
      //   });
      console.log('owner balance: ', await (await tokenOwner.getBalance()).toBigInt());

      const gasPrice = await getProvider().getGasPrice();
      const feeData = await getProvider().getFeeData();
      console.log('gasPrice: %s, maxfeepergas: %s, maxPriorityFeePerGas: %s', gasPrice.toBigInt(), feeData.maxFeePerGas?.toBigInt(), feeData.maxPriorityFeePerGas?.toBigInt());
      const tx = await token.mintAndTransfer(data, transferTo, mint,
        {
          from: tokenOwner.address,
          gasLimit: 5_000_000,
          // gasPrice: '0x07a120',
          gasPrice: 31_000_300_000,
          nonce: undefined,
          // maxFeePerGas: ethers.utils.parseUnits(Math.ceil(feeData.maxFeePerGas as unknown as number).toString(), 'gwei'),
          // maxPriorityFeePerGas: ethers.utils.parseUnits(Math.ceil(feeData.maxPriorityFeePerGas as unknown as number).toString(), 'gwei'),
        });
      console.log(`Transaction Hash: ${tx.hash}`);
    } catch(e) {
      console.log("Error minting: ", e);
    }
  });

task("transfer", "Transfer from one user to another")
  .addParam("address", "The address to receive a token", undefined, undefined, true)
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;
    const tokenOwner = getAccount();
    const from = "0x6e35fee1f1bc18df34bedccf6c2d677ae6897768";
    const to = "0x294fd38352221768aacca0918c932648ba2ce98a";
    const tokenId = "49849815373610282976545979791172163512204306443536784842701054358673105616898";
    const tx = await contract.safeTransferFrom(from, to, tokenId, 1, zeroWord);
    console.log(`Transaction Hash: ${tx.hash}`);
  });

// Eg., npx hardhat set-base-uri --baseuri ipfs://
task("set-base-uri", "Sets the baseURI in the contract")
  .addParam("baseuri", "The new baseURI to set in the contract")
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;
    console.log(`Updating base URI to ${taskArguments.baseuri}`)
    const tx = await contract.setBaseURI(taskArguments.baseuri,
      {
        gasLimit: 5_000_000,
        gasPrice: 31_000_300_000,
        nonce: undefined,
      });
    console.log("Transaction hash %s", tx.hash);
  });

task("set-token-uri", "Sets a token URI in the contract")
  .addParam("tokenid", "The new token ID to set the URI for")  
  .addParam("uri", "The new token URI to set in the contract")
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;
    const tx = await contract.setBaseTokenURI(taskArguments.tokenid, taskArguments.uri);
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