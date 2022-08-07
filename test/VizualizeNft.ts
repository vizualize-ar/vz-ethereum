import { AbiCoder } from "@ethersproject/abi";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Overrides, PayableOverrides } from "ethers";
import { ethers } from "hardhat";
import { upgrades } from "hardhat";
import { VizualizeNft, TestRoyaltyV2981Calculate } from "../typechain-types";
import { LibERC1155LazyMint } from "../typechain-types/contracts/VizualizeNft";
import * as ethsig from "@metamask/eth-sig-util";
import { createTypeData, signTypedData } from "../scripts/EIP712";
import { Types, getSignature, creators } from "../scripts/helpers";
import { arrayify, hexlify, hexValue, parseBytes32String, toUtf8Bytes, hexZeroPad, BytesLike } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import * as EIP712 from "../scripts/EIP712";

const mintPrice = ethers.utils.parseEther("0.005");
// const ONE_GWEI = 1_000_000_000;
const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("VizualizeNft", () => {
  async function deployNFTFixture() {

    // Contracts are deployed using the first signer/account by default
    // account1: transferProxy - need to set to rarible contract address
    // account2: lazyTransferProxy - need to set to rarible contract address
    const [owner, transferProxy, lazyTransferProxy, account3, account4, account5, account6, account7 ] = await ethers.getSigners();
    console.log('owner: %s, account1: %s, account2: %s', owner.address, transferProxy?.address, lazyTransferProxy?.address);

    const nftContractFactory = await ethers.getContractFactory("VizualizeNft");
    try {
      // const nft = await nftContractFactory.deploy();
      const nft = await upgrades.deployProxy(nftContractFactory, ["VizualizeNFT", "VZNFT", "ipfs:/", "ipfs:/", [], transferProxy.address, lazyTransferProxy.address]) as VizualizeNft;
      console.log("___proxy deployed to %s", nft.address);
      const contract = await nft.deployed() ;
      console.log("contract deployed to %s", contract.address);

      // await nft.__ERC1155RaribleUser_init("VizualizeNFT", "VZNFT", "ipfs:/", "ipfs:/", [owner.address], account1.address, account2.address, { from: owner.address });

      return { nft: nft, owner, transferProxy, lazyTransferProxy, account3, account4, whiteListProxy: account5, account6, account7 };
    } catch (err: any) {
      if (err.error && err.code === "UNPREDICTABLE_GAS_LIMIT") {
        err = err.error;
      }
      console.log("deployNFTFixture error %s", err.message);
      throw err;
    }
  }

  async function deployTestRoyalties() {
    const contractFactory = await ethers.getContractFactory("TestRoyaltyV2981Calculate");
    const testRoyalty: TestRoyaltyV2981Calculate = await contractFactory.deploy();

    const [owner, account1, account2, account3, account4, account5 ] = await ethers.getSigners();
    return { testRoyalty, owner, account1, account2, account3, account4, account5 };
  }

  it("should deploy", async function () {
    const { nft: token } = await loadFixture(deployNFTFixture);
    expect(token.address).to.not.be.null;
  });

  it("should support ERC165 interface", async () => {
    const { nft: token } = await loadFixture(deployNFTFixture);
    
    // const code = await ethers.provider.getCode(token.address)
    // console.log(code) // if this is 0x means no contract code is present

    let interfaceId = arrayify("0x01ffc9a7");
  	expect(await token.supportsInterface(interfaceId)).to.be.true;
  });

  it("should support mintAndTransfer interface", async () => {
    const { nft: token } = await loadFixture(deployNFTFixture);
  	expect(await token.supportsInterface("0x6db15a0f")).to.be.true;
  });

  it("should support RoayltiesV2 interface", async () => {
    const { nft: token } = await loadFixture(deployNFTFixture);
  	expect(await token.supportsInterface("0xcad96cca")).to.be.true;
  });

  it("should support ERC1155 interfaces", async () => {
    const { nft: token } = await loadFixture(deployNFTFixture);
  	expect(await token.supportsInterface("0xd9b67a26")).to.be.true;
    expect(await token.supportsInterface("0x0e89341c")).to.be.true;
  });

  it("should support IERC2981 interface", async () => {
    const { nft: token } = await loadFixture(deployNFTFixture);
  	expect(await token.supportsInterface("0x2a55205a")).to.be.true;
  });

  it("check Royalties IERC2981", async () => {
    const { nft: token, owner: tokenOwner, account3, account4, account6, account7 } = await loadFixture(deployNFTFixture);
    const { testRoyalty: testRoyaltyV2981Calculate } = await loadFixture(deployTestRoyalties);

    const minter = tokenOwner;
    let transferTo = account3;
    let royaltiesBeneficiary1 = account4;
    let royaltiesBeneficiary2 = account6;
    let royaltiesBeneficiary3 = account7;
    const WEIGHT_PRICE = 1000000;
    let supply = 5;
    let mint = 2;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    const signature = await getSignature(token, tokenId, tokenURI, supply, creators([minter]), fees([royaltiesBeneficiary1,royaltiesBeneficiary2,royaltiesBeneficiary3]), minter);

    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: fees([royaltiesBeneficiary1,royaltiesBeneficiary2,royaltiesBeneficiary3]), signatures: [signature] };
    const tx = await token.mintAndTransfer(data, transferTo.address, mint, {from: tokenOwner.address});
    const addressValue = await token.royaltyInfo(tokenId, WEIGHT_PRICE);

    expect(addressValue[0]).to.eq(royaltiesBeneficiary1.address, "account");
    expect(addressValue[1]).to.eq(150000, "value"); //why 15000?: 3 beneficiaries, each have 5%(500) in total 15%(1500), but WEIGHT_PRICE = 1000000, and 15% form this is 150000
    const royaltiesAddress = addressValue[0];
    const royaltiesPercent = addressValue[1];
    let royaltiesPart = await testRoyaltyV2981Calculate.calculateRoyaltiesTest(royaltiesAddress, royaltiesPercent);
    expect(royaltiesPart[0].account).to.eq(royaltiesBeneficiary1.address, "account");
    expect(royaltiesPart[0].value).to.eq(1500, "value");
  });

  it("should pause contract", async () => {
    const { nft } = await loadFixture(deployNFTFixture);
    expect(await nft.paused()).to.be.false;
    await nft.pause(true);
    expect(await nft.paused()).to.be.true;
    await nft.pause(false);
    expect(await nft.paused()).to.be.false;
  });

  it("should set base token URI", async () => {
    const { nft: token } = await loadFixture(deployNFTFixture);
    expect(await token.baseURI()).to.eq("ipfs:/");
    const newBaseUri = "http://some.domain";
    const tx = await token.setBaseURI(newBaseUri);
    expect(await token.baseURI()).to.eq(newBaseUri);
    expect(tx).to.emit(token, "BaseUriChanged")
      .withArgs(newBaseUri);
  });

  it("should approve for all", async () => {
    const { nft, owner, account3 } = await loadFixture(deployNFTFixture);
    expect(await nft.isApprovedForAll(owner.address, account3.address)).to.be.false;
    await nft.setApprovalForAll(account3.address, true);
    expect(await nft.isApprovedForAll(owner.address, account3.address)).to.be.true;
  });

  it("should mint nft and transfer immediately", async () => {
    const { nft, owner, account3 } = await loadFixture(deployNFTFixture);
    const data = await createOwnerTokenData(owner, account3);
    const tokenId = data.tokenId;

    await expect(nft.mintAndTransfer(data, account3.address, 1)).to.not.be.reverted;
    const creators = await nft.getCreators(tokenId);
    expect(creators.length).to.eq(1);
    expect(await nft.balanceOf(account3.address, tokenId)).to.eq(1);
    expect(await nft.balanceOf(owner.address, tokenId)).to.eq(0);
  });

  it("mint and transfer by proxy. minter is tokenOwner", async () => {
    const { nft: token, owner: tokenOwner, account3 } = await loadFixture(deployNFTFixture);
    let minter = tokenOwner;
    let transferTo = account3;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "/uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(token, tokenId, tokenURI, supply, creators([minter]), [], minter);
    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [signature] };
    await token.mintAndTransfer(data, transferTo.address, mint, { from: tokenOwner.address });

		expect(await token.uri(tokenId)).to.eq("ipfs:/" + tokenURI);
    expect(await token.balanceOf(transferTo.address, tokenId)).to.eq(mint);
  });

  it("mint and transfer by minter. minter is tokenOwner", async () => {
    const { nft: token, owner: tokenOwner, account3 } = await loadFixture(deployNFTFixture);
    let minter = tokenOwner;
    let transferTo = account3;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [zeroWord] };
    await token.mintAndTransfer(data, transferTo.address, mint, { from: minter.address });

    expect(await token.balanceOf(transferTo.address, tokenId)).to.eq(mint);
  });

  it("mint and transfer by minter. minter is not tokenOwner", async () => {
    const { nft: token, owner: tokenOwner, account3, account4 } = await loadFixture(deployNFTFixture);
    let minter = account3;
    let transferTo = account4;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [zeroWord] };
    await expect(token.mintAndTransfer(data, transferTo.address, mint, {from: minter.address})).to.be.rejected;
  });

  it("mint and transfer by minter several creators", async () => {
    const { nft: token, owner: tokenOwner, account3, account4 } = await loadFixture(deployNFTFixture);
    let minter = tokenOwner;
    const creator2 = account3;
    let transferTo = account4;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature2 = await getSignature(token, tokenId, tokenURI, supply, creators([minter, creator2]), [], creator2);

    const data = { tokenId, tokenURI, supply, creators: creators([minter, creator2]), royalties: [], signatures: [zeroWord, signature2] };
    await token.mintAndTransfer(data, transferTo.address, mint, {from: minter.address});

    expect(await token.balanceOf(transferTo.address, tokenId)).to.eq(mint);
    await checkCreators(token, tokenId, [minter.address, creator2.address]);
  });

  it("mint and transfer to self by minter", async () => {
    const { nft: token, owner: tokenOwner, account3, account4 } = await loadFixture(deployNFTFixture);
    let minter = tokenOwner;
    let transferTo = minter;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [zeroWord] };
    await token.mintAndTransfer(data, transferTo.address, mint, {from: minter.address});

    expect(await token.balanceOf(transferTo.address, tokenId)).to.eq(mint);
    await checkCreators(token, tokenId, [minter.address]);
  });

  it("mint and transfer with minter access control", async () => {
    const { nft: token, owner: tokenOwner, account3, account4 } = await loadFixture(deployNFTFixture);
    const minter = account3;
    let transferTo = account4;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [zeroWord] };
    await expect(token.mintAndTransfer(data, transferTo.address, mint)).to.be.revertedWith("not owner or minter")
    
    await token.addMinter(minter.address, {from: tokenOwner.address});
    expect(await token.isMinter(minter.address)).to.be.true;
    expect(await token.isMinter(transferTo.address)).to.be.false;
    
    const minterToken = token.connect(minter);
    await minterToken.mintAndTransfer(data, transferTo.address, mint);
    expect(await token.balanceOf(transferTo.address, tokenId)).to.eq(mint);
    expect(await token.balanceOf(minter.address, tokenId)).to.eq(0);
  });

  it("mint and transfer with minter access control and minter signature", async () => {
    const { nft: token, owner: tokenOwner, account3, account4 } = await loadFixture(deployNFTFixture);
    const minter = account3;
    let transferTo = account4;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(token, tokenId, tokenURI, supply, creators([minter]), [], minter);

    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [signature] };
    await expect(token.mintAndTransfer(data, transferTo.address, mint, {from: minter.address})).to.be
      .rejectedWith("Contract with a Signer cannot override from (operation=\"overrides.from\", code=UNSUPPORTED_OPERATION, version=contracts/5.6.2)");

    await token.addMinter(minter.address, {from: tokenOwner.address});
    expect(await token.isMinter(minter.address)).to.eq(true);

    const minterToken = token.connect(minter);
    await minterToken.mintAndTransfer(data, transferTo.address, mint, {from: minter.address});
    expect(await token.balanceOf(transferTo.address, tokenId)).to.eq(mint);
    expect(await token.balanceOf(minter.address, tokenId)).to.eq(0);
  });

  it("mint and transfer with minter access control and wrong minter signature", async () => {
    const { nft: token, owner: tokenOwner, account3, account4, whiteListProxy } = await loadFixture(deployNFTFixture);
    const minter = account3;
    let transferTo = account4;

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(token, tokenId, tokenURI, supply, creators([minter]), [], transferTo);

    const data = { tokenId, tokenURI, supply, creators: creators([minter]), royalties: [], signatures: [signature] };
    await expect(token.mintAndTransfer(data, transferTo.address, mint, {from: minter.address})).to.be
      .rejectedWith("Contract with a Signer cannot override from (operation=\"overrides.from\", code=UNSUPPORTED_OPERATION, version=contracts/5.6.2)");

    await token.addMinter(minter.address, {from: tokenOwner.address});
    expect(await token.isMinter(minter.address)).to.be.true;

    await expect(token.mintAndTransfer(data, transferTo.address, mint, {from: whiteListProxy.address})).to.be
     .rejectedWith("Contract with a Signer cannot override from (operation=\"overrides.from\", code=UNSUPPORTED_OPERATION, version=contracts/5.6.2)");
  });

//   describe("withdraw function", () => {
//     it("should throw error when no balance", async () => {
//       const { nft, owner } = await loadFixture(deployNFTFixture);
//       expect(await nft.balanceOf(owner.address)).to.eq(0);
//       await expect(nft.withdraw()).to.be.rejectedWith("No ether left to withdraw");
//     });

//     it("should withdraw", async () => {
//       const { nft, owner, account1: otherAccount } = await loadFixture(deployNFTFixture);
//       const overrides: PayableOverrides = { value: mintPrice };
//       // console.log('mint price', mintPrice);
      
//       await nft.mintTo(otherAccount.address, overrides);
//       expect(await nft.balanceOf(owner.address)).to.eq(0);
      
//       const transaction = await nft.withdraw();

//       await expect(transaction).to.changeEtherBalances(
//         [owner, nft],
//         [mintPrice, -mintPrice]
//       );
//     });
//   });

//   it("should transfer from account1 to account2", async () =>{
//     const { nft, owner, account1, account2 } = await loadFixture(deployNFTFixture);
    
//     const overrides: PayableOverrides = { value: mintPrice };
//     await nft.mintTo(account1.address, overrides);
    
//     expect(await nft.balanceOf(account1.address)).to.eq(1);
//     expect(await nft.balanceOf(account2.address)).to.eq(0);

//     var account1Nft = await nft.connect(account1);
//     await expect(account1Nft.transferFrom(account1.address, account2.address, 1)).not.to.be.reverted;

//     expect(await nft.balanceOf(account1.address)).to.eq(0);
//     expect(await nft.balanceOf(account2.address)).to.eq(1);
//   });

//   it("should transfer from contract owner to account2", async () =>{
//     const { nft, owner, account1, account2 } = await loadFixture(deployNFTFixture);
    
//     const overrides: PayableOverrides = { value: mintPrice };
//     await nft.mintTo(account1.address, overrides);

//     // Allow contract owner to transfer ownership of tokens
//     var account1Nft = await nft.connect(account1);
//     await account1Nft.setApprovalForAll(owner.address, true);
    
//     expect(await nft.balanceOf(account1.address)).to.eq(1);
//     expect(await nft.balanceOf(account2.address)).to.eq(0);

//     await expect(nft.transferFrom(account1.address, account2.address, 1)).not.to.be.reverted;

//     expect(await nft.balanceOf(account1.address)).to.eq(0);
//     expect(await nft.balanceOf(account2.address)).to.eq(1);
//   });
});

async function createOwnerTokenData(tokenOwner: SignerWithAddress, account1: SignerWithAddress) {
  const tokenId = tokenOwner.address + "b00000000000000000000001";
  const data: LibERC1155LazyMint.Mint1155DataStruct = {
    tokenId,
    tokenURI: "/nft/1",
    supply: 1,
    creators: [
      {
        account: tokenOwner.address,
        value: 10000
      }
    ],
    royalties: [
      {
        account: tokenOwner.address,
        value: 1500
      }, {
        account: account1.address,
        value: 1000
      }
    ],
    signatures: [zeroWord]
  };

  return data;
}

async function createTokenDataLazy(contract: VizualizeNft, tokenOwner: SignerWithAddress, minter: SignerWithAddress) {
  const tokenId = minter.address + "b00000000000000000000001";
  const data: LibERC1155LazyMint.Mint1155DataStruct = {
    tokenId,
    tokenURI: "/nft/1",
    supply: 1,
    creators: [
      {
        account: minter.address,
        value: 10000
      }
    ],
    royalties: [
      {
        account: minter.address,
        value: 1500
      }, {
        account: tokenOwner.address,
        value: 1000
      }
    ],
    signatures: []
  };

  const chainId = ethers.getDefaultProvider().network.chainId;
  console.log("createTokenDataLazy: chainId %s", chainId);
  // const signature = await sign(chainId, tokenOwner.address, data.tokenId, data.tokenURI, data.supply, data.creators, data.royalties, contract.address);
  // data.signatures.push(signature);
  
  // All properties on a domain are optional
  const domain = {
    name: "Mint1155",
    version: "1",
    chainId,
    // verifyingContract: contract.address
  };

  // The named list of all type definitions
  const types = Types;

  // The data to sign
  const value = { tokenId, supply: data.supply, tokenURI: data.tokenURI, creators: data.creators, royalties: data.royalties };

  const signature = await tokenOwner._signTypedData(domain, types, value);
  data.signatures.push(signature);

  console.log("Test: minter:%s", minter.address);

  return data;
}



async function checkCreators(token: VizualizeNft, tokenId: any, exp: any[]) {
  const creators = await token.getCreators(tokenId);
  expect(creators.length).to.eq(exp.length);
  const value = 10000 / exp.length;
  for(let i = 0; i < creators.length; i++) {
    expect(creators[i][0]).to.eq(exp[i]);
    expect(creators[i][1]).to.eq(value);
  }
}

function fees(list: any[]) {
  const value = 500;
  return list.map(account => ({ account: account.address, value }))
}