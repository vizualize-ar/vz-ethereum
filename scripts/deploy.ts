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

import { FeeData } from "@ethersproject/providers";
import { DeployProxyOptions } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("deploy:lock", "Deploys the Lock.sol contract").setAction(async function (
  taskArguments: any,
  hre: HardhatRuntimeEnvironment
) {
  console.log(`Network: ${process.env.NETWORK}`);

  const [deployer] = await hre.ethers.getSigners();
  const accountBalance = await deployer.getBalance();

  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log("Account balance: ", accountBalance.toString());

  const FEE_DATA = {
    maxFeePerGas:         hre.ethers.utils.parseUnits('1000', 'gwei'),
    maxPriorityFeePerGas: hre.ethers.utils.parseUnits('50',   'gwei'),
  };
  // Wrap the provider so we can override fee data.
  const provider = new hre.ethers.providers.FallbackProvider([hre.ethers.provider], 1);
  provider.getFeeData = async () => FEE_DATA as FeeData;
  const signer = new hre.ethers.Wallet(`0x${process.env.ACCOUNT_PRIVATE_KEY}`).connect(provider);

  const contractFactory = await hre.ethers.getContractFactory("Lock", signer);

  console.log('Deploying contract');
  
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const ONE_GWEI = 1_000_000_000;
  const lockedAmount = ONE_GWEI;
  // const contract = await contractFactory.deploy(unlockTime, { value: lockedAmount });

  const deployFn = await hre.upgrades.deployProxy(contractFactory, [unlockTime, { value: lockedAmount }]);
  console.log(`Proxy address ${deployFn.address}, tx hash ${deployFn.deployTransaction?.hash}`)

  console.log('Waiting for deployment to finish');
  const contract = await deployFn.deployed();

  console.log(`Deployment finished. Proxy address ${deployFn.address}. Contract address: ${contract.address}`);
});

task("deploy", "Deploys the VizualizeNft.sol contract").setAction(async function (
  taskArguments: any,
  hre: HardhatRuntimeEnvironment
) {
  console.log(`Network: ${process.env.NETWORK}`);

  const [deployer] = await hre.ethers.getSigners();
  const accountBalance = await deployer.getBalance();
  const transferProxyAddress = process.env.POLYGON_TRANSFER_PROXY_ADDRESS;

  console.log(`Deploying contracts with account: ${deployer.address} with proxy ${transferProxyAddress}`);
  console.log("Account balance: ", accountBalance.toString());

  const FEE_DATA = {
    maxFeePerGas:         hre.ethers.utils.parseUnits('1000', 'gwei'),
    maxPriorityFeePerGas: hre.ethers.utils.parseUnits('50',   'gwei'),
  };
  // Wrap the provider so we can override fee data.
  // const provider = new hre.ethers.providers.FallbackProvider([hre.ethers.provider], 1);
  // provider.getFeeData = async () => FEE_DATA as FeeData;
  // const signer = new hre.ethers.Wallet(`0x${process.env.ACCOUNT_PRIVATE_KEY}`).connect(provider);
  // const nftContractFactory = await hre.ethers.getContractFactory("VizualizeNft", signer);

  const nftContractFactory = await hre.ethers.getContractFactory("VizualizeNft", deployer);

  await hre.upgrades.validateImplementation(nftContractFactory);

  console.log('Deploying contract');
  // const nft = await nftContractFactory.deploy();
  // const nft = await hre.upgrades.deployProxy(nftContractFactory, ["VizualizeNFT", "VZNFT", "ipfs:/", "ipfs:/", [], transferProxyAddress, transferProxyAddress]);
  // const nft = await hre.upgrades.deployProxy(nftContractFactory, ["VZNFTDEV", "VZNFTDEV", "https://", "ipfs:/", [], transferProxyAddress, transferProxyAddress]);
  // const nft = await hre.upgrades.deployProxy(nftContractFactory, ["VZNFTDEV2", "VZNFTDEV2", "ipfs://", "ipfs://", [], transferProxyAddress, transferProxyAddress]);
  
  const deployOptions: DeployProxyOptions = {
    timeout: 3 * 60 * 1000,
    pollingInterval: 10 * 1000
  }
  const proxy = await hre.upgrades.deployProxy(nftContractFactory, ["Vizualize", "VIZ", "ipfs://", "ipfs://", [], transferProxyAddress, transferProxyAddress], deployOptions);
  console.log(`Proxy address ${proxy.address}, tx hash ${proxy.deployTransaction?.hash}`)

  console.log('Waiting for deployment to finish');
  const contract = await proxy.deployed();

  console.log(`Deployment finished. Proxy address ${proxy.address}. Contract address: ${contract.address}`);
});

task("update", "Updates the VizualizeNft contract").setAction(async function (
  taskArguments: any,
  hre: HardhatRuntimeEnvironment
) {
  console.log(`Network: ${process.env.NETWORK}`);

  const [deployer] = await hre.ethers.getSigners();
  const accountBalance = await deployer.getBalance();
  const transferProxyAddress = process.env.POLYGON_TRANSFER_PROXY_ADDRESS;

  console.log(`Deploying contracts with account: ${deployer.address} with proxy ${transferProxyAddress}`);
  console.log("Account balance: ", accountBalance.toString());

  const nftContractFactory = await hre.ethers.getContractFactory("VizualizeNft", deployer);
  await hre.upgrades.validateImplementation(nftContractFactory);

  console.log('Updating contract');  
  const contractAddress: string = process.env.NFT_CONTRACT_ADDRESS + '';
  const proxy = await hre.upgrades.upgradeProxy(contractAddress, nftContractFactory);
  console.log(`Proxy address ${proxy.address}, tx hash ${proxy.deployTransaction?.hash}`)

  console.log('Waiting for update to finish');
  const contract = await proxy.deployed();

  console.log(`Update finished. Proxy address ${proxy.address}. Contract address: ${contract.address}`);
});
