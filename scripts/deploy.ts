// import { ethers } from "hardhat";

// async function main() {
//   const currentTimestampInSeconds = Math.round(Date.now() / 1000);
//   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
//   const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

//   const lockedAmount = ethers.utils.parseEther("1");

//   const Lock = await ethers.getContractFactory("Lock");
//   const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

//   await lock.deployed();

//   console.log("Lock with 1 ETH deployed to:", lock.address);
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAccount } from "./helpers";

task("deploy", "Deploys the VizualizeNft.sol contract").setAction(async function (
  taskArguments: any,
  hre: HardhatRuntimeEnvironment
) {
  const [deployer] = await hre.ethers.getSigners();
  const accountBalance = await deployer.getBalance();
  const transferProxyAddress = process.env.POLYGON_TRANSFER_PROXY_ADDRESS;

  console.log("Deploying contracts with account: ", deployer.address);
  console.log("Account balance: ", accountBalance.toString());

  // const nftContractFactory = await hre.ethers.getContractFactory("NFT", getAccount());
  const nftContractFactory = await hre.ethers.getContractFactory("VizualizeNft");
  // const nft = await nftContractFactory.deploy();
  // const nft = await hre.upgrades.deployProxy(nftContractFactory, ["VizualizeNFT", "VZNFT", "ipfs:/", "ipfs:/", [], transferProxyAddress, transferProxyAddress]);
  const nft = await hre.upgrades.deployProxy(nftContractFactory, ["VizualizeNFT", "VZNFT", "https://", "ipfs:/", [], transferProxyAddress, transferProxyAddress]);
  await nft.deployed();
  console.log(`Contract deployed to address: ${nft.address}`);
});
