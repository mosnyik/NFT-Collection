const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env"});
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main(){
    // contract address from the whitelist contract deployed in the previous stage
    const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

    // URL for where we can extract the metadata for the Crypto Dev NFT
    const metadataURL = METADATA_URL;

    // create a ContractFactory to help instantaite a the CryptoDev contract
    const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

    // deploy the contract
    const deployCryptoDevsContract = await cryptoDevsContract.deploy(
        metadataURL,
        whitelistContract
    );
    const deployedCryptoDevsContract = await deployCryptoDevsContract.deployed();

    // print the address of the deployed contract
    console.log(
        "Crypto Devs Contract Address:", deployedCryptoDevsContract.address
    );
}

main().then(()=>process.exit(0)).catch((error)=>{
    console.error(error);
    process.exit(1);
})

// Crypto Devs Contract Address: 0x0C48BE8Df0Fe85D6Dc94D1c6e1e7092d2D037A66