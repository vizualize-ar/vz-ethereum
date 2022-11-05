import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

import "./scripts/deploy";
import "./scripts/mint";
import "./scripts/update";

dotenv.config();
const { ALCHEMY_KEY, ACCOUNT_PRIVATE_KEY, POLYGON_PRIVATE_KEY, ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY } =
  process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },
  defaultNetwork: process.env.NETWORK || "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: 'auto'
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
    },
    ethereum: {
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
    },
    maticmum: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
      allowUnlimitedContractSize: true,
      gas: 'auto'
    },
    matic: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
      gas: 'auto',
    }
  },
  etherscan: {
    apiKey: POLYGONSCAN_API_KEY,
  }
};

export default config;
