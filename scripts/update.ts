import { task } from "hardhat/config";
import { getContract, getProvider } from "./helpers";
import { VizualizeNft } from "../typechain-types";

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

// Eg., npx hardhat set-token-uri --tokenid 38312504226238262500385075860556867291744409460277345860262828688035962421249 --uri bafybeihdzv7c5afxvafjg2dpun3tdt23lu3l344rcnozxzyp7denj2cxme/metadata.json
task("set-token-uri", "Sets a token URI in the contract")
  .addParam("tokenid", "The new token ID to set the URI for")  
  .addParam("uri", "The new token URI to set in the contract")
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;

    const gasPrice = await getProvider().getGasPrice();
    const feeData = await getProvider().getFeeData();

    console.log('gasPrice: %s, maxfeepergas: %s, maxPriorityFeePerGas: %s', gasPrice.toBigInt(), feeData.maxFeePerGas?.toBigInt(), feeData.maxPriorityFeePerGas?.toBigInt());

    const tx = await contract.setTokenURI(taskArguments.tokenid, taskArguments.uri, {
      gasLimit: 1_000_000,
      gasPrice: gasPrice.toBigInt() * BigInt(2),
    });
    console.log("Transaction hash %s", tx.hash);
  });

// Eg., npx hardhat get-token-uri --tokenid 38312504226238262500385075860556867291744409460277345860262828688035962421249
task("get-token-uri", "Fetches the token metadata for the given token ID")
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


// Eg., npx hardhat set-token-name --name VZNFTDEVX
task("set-token-name", "Sets the token name in the contract")
  .addParam("name", "The new token name")  
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;

    const gasPrice = await getProvider().getGasPrice();
    const feeData = await getProvider().getFeeData();

    console.log('gasPrice: %s, maxfeepergas: %s, maxPriorityFeePerGas: %s', gasPrice.toBigInt(), feeData.maxFeePerGas?.toBigInt(), feeData.maxPriorityFeePerGas?.toBigInt());
    console.log(`Updating name from ${await contract.name()} to ${taskArguments.name}`)

    const tx = await contract.setName(taskArguments.name, {
      gasLimit: 1_000_000,
      gasPrice: gasPrice.toBigInt() * BigInt(2),
    });
    console.log("Transaction hash %s", tx.hash);
  });

// Eg., npx hardhat set-token-symbol --symbol VZNFTDEVX
task("set-token-symbol", "Sets the token symbol in the contract")
  .addParam("symbol", "The new token symbol")  
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;

    const gasPrice = await getProvider().getGasPrice();
    const feeData = await getProvider().getFeeData();

    console.log('gasPrice: %s, maxfeepergas: %s, maxPriorityFeePerGas: %s', gasPrice.toBigInt(), feeData.maxFeePerGas?.toBigInt(), feeData.maxPriorityFeePerGas?.toBigInt());
    console.log(`Updating symbol from ${await contract.symbol()} to ${taskArguments.symbol}`)

    const tx = await contract.setSymbol(taskArguments.symbol, {
      gasLimit: 1_000_000,
      gasPrice: gasPrice.toBigInt() * BigInt(2),
    });
    console.log("Transaction hash %s", tx.hash);
  });

// Eg., npx hardhat set-contract-uri --uri http://
task("set-contract-uri", "Sets the uri in the contract")
  .addParam("uri", "The new contract uri")  
  .setAction(async (taskArguments, hre) => {
    const contract = await getContract("VizualizeNft", hre) as VizualizeNft;

    const gasPrice = await getProvider().getGasPrice();
    const feeData = await getProvider().getFeeData();

    console.log('gasPrice: %s, maxfeepergas: %s, maxPriorityFeePerGas: %s', gasPrice.toBigInt(), feeData.maxFeePerGas?.toBigInt(), feeData.maxPriorityFeePerGas?.toBigInt());
    console.log(`Updating uri from ${await contract.contractURI()} to ${taskArguments.uri}`)

    const tx = await contract.setContractURI(taskArguments.uri, {
      gasLimit: 1_000_000,
      gasPrice: gasPrice.toBigInt() * BigInt(2),
    });
    console.log("Transaction hash %s", tx.hash);
  });