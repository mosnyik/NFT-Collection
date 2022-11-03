// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    /*
    @dev _baseTokenURI for computing {tokenURI}. `tokenURI` = `baseURI` + `tokenId`
     */
    string _baseTokenURI;

    // _price is the price for one Crypto Dev NFT
    uint256 public _price = 0.01 ether;

    // _paused a transaction in case of an emergency
    bool public _paused;

    // max number of CryptoDevs
    uint256 public maxTokenIds = 20;

    // total number of tokenIds minted
    uint256 public tokenIds;

    // Whitelist contract instance
    IWhitelist whitelist;

    // presaleStarted tracks if presale started
    bool public presaleStarted;

    // presaleEnded tracks if presale ended
    uint256 public presaleEnded;

    // it runs before or after a function as specified by the `_`
    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }

    /**
     * @dev ERC721 constrcutor takes `name` and `symbol` to the NFT Collection
     * takes baseURI and sets it to _baseTokenURI for the collection
     * initiatlizes an instance of the IWhitelist interface
     */

    constructor (string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    /**
     * @dev startPresale starts the presale for the whitelisted addresses
     */
    function startPresale () public onlyOwner{
        presaleStarted = true;

        // sets the time to end the presale,  current timesatmp + 5 minutes
        presaleEnded = block.timestamp + 5 minutes;
    }

    /**
     * @dev presaleMint allows the user to mint one NFT per transaction during the presale
     */

    function presaleMint() public payable onlyWhenNotPaused {
        // check if the presale time is valid
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");

        // check if the address is whitelisted
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");

        // check if the max number of NFTs have been minted already
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");

        // check if the address has enough balance to mint the NFT
        require(msg.value >= _price, "Ehter sent is not correct");
        tokenIds += 1;

         /**
         * _safeMint 
         *  - takes a `to` address and a `tokenId`
         *  - calls the mint function
         *  - checks that the `to` address is not a null address
         *  - checks if the `tokenId` has already been minted to someone else
         *  - assigns the `to` address to be rhe owner of the just minted tokenId
         *  - increases the balance of the owner address
         *  - emmits an event to indicate that the tokenId have been minted to the 
         *    owner address
         *  - after the mint, it checks if the NFT was recieved correctly
         *    by the owner adrress or the if the owner address is 
         *    not able to recieve an ERC721 contract
          */ 
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev mint function allows a user to mint 1 NFT per transaction after the presale has ended
     */

    function mint() public payable onlyWhenNotPaused{
        // check if presale has ended
        require(presaleStarted && block.timestamp >= presaleEnded, "Presalle has not ended yet");

        // check if the max number of Crypto Dev NFTs have been minted already
        require(tokenIds < maxTokenIds, "Crypto Devs supply exceeded");

        //check if the user has enough to mint the NFT
        require(msg.value >= _price, "Ether sent is not correct");

        // increament the number of tokens minted
        tokenIds += 1;
       
        // a safe way to mint ERC721, check if the minted address is a contract
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev overide the openzeppelin's ERC721 baseURI and set it to _baseURI
     */

    function _baseURI() internal view virtual override returns (string memory){
        return _baseTokenURI;
    }

    /**
     * @dev setPaused make the contract to pause or unpause
     * can only be called by the pwner or deployer of the contract
     */

    function setPaused(bool val) public onlyOwner{
        _paused = val;
    }

    /**
     * @dev withdraw sends all the Ether in the contract to the owner of the contract
     */

    function withdraw() public onlyOwner{
        // set the owner of the contract to the
        // address that deployed the contract by default
        address _owner = owner();

        // set the balance of the smart contract to the amount
        uint256 amount = address(this).balance;

      /**
       * initiate a transfer of the amount in the 
       * smart contract to `_owner`
       * the `sent` bool checks if the transaction is successful
       * the `_owner` variable is the address that recieves the transfer
       * the `call` function takes the amount to be transfered 
       * and the srtring afteer it is the msg that is sent with the 
       * ether
        
       */
        (bool sent, ) = _owner.call{value: amount}("");
        // check if the send was successful
        require(sent, "failed to send Ether");
    }

    // recieve function would recieve the Ether when 
    //the sender send it without a message
    receive() external payable{}

    //Fallback function would recieve the Ether when 
    //the sender send it with a message
    fallback() external payable{}
    

}