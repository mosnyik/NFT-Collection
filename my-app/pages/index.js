import Head from 'next/head';
import styles from '../styles/Home.module.css';
import{ Contract, providers, utils } from 'ethers';
import React, { useRef, useState, useEffect} from 'react';
import Web3Modal from 'web3modal';
import { abi, NFT_CONTRACT_ADDRESS } from '../constants';


export default function Home() {
  // track if wallet is connected
  const [walletConnected, setWalletConnected] = useState(false);

  // track if presale has started 
  const [presaleStarted, setPresaleStarted] = useState(false);
  
  // track if presale has ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  
  // set loading when wait for a transaction
  const [loading, setLoading] = useState(false);

  //check if the person calling the fuction is the owner
  const [isOwner, setIsOwner] = useState(false);

  // track the number of tokens minted so far
  const [tokenIdsMinted, setTokenIdsMinted] = useState(false);

  // keep reference of the web3modal
  const web3ModalRef = useRef();

  // Mint NFT during the presale
  const presaleMint = async()=>{
    try{
      // get the signer from the wallet connected
      const signer = await getProviderOrSigner(true);

      // make an instance of the NFT contract with a signer
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        abi,
        signer
      );
      
      // call the presaleMint function
      const tx = await nftContract.presaleMint({
            // parse the ethers value using the utils library of js
            value : utils.parseEther("0.01"), 
          });

      // UX update, let the user knw something is working in the background
      setLoading(true);

      await tx.wait();

      // after the mint, stop showing Loading on the screen 
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev NFT!")
    }catch(err){
      console.error(err);
    }
  };

  // public mint : for minting after presale
  const publicMint = async () => {
    try{
      // fetch the signer
      const signer = await getProviderOrSigner(true);

      // make an instance of the NFT contract with the signer
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      // inintaite the mint call
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);

      //wait for mint to complete
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev NFT!")
    }
    catch(err){
      console.error(err);
      window.alert("there was a problem trying to mint your NFT, try again")
    }
  };

  const connectWallet = async() =>{
    try{
      // fetch the provider for the present wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(err){
      console.error(err);
    }
  };

  // start the presale
  const startPresale = async () =>{
    try{
      // fetch the signer
      const signer = await getProviderOrSigner(true);

      // make an instance of the nftContract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // start the presale
      const tx = await nftContract.startPresale();
      setLoading(true);

      await tx.wait();
      setLoading(false);

      // set presale to started 
      await checkIfPresaleStarted();
    }catch(err){
      console.error(err);
      window.alert("Something went wrong while trying to mint, try again");
    }
  };

  // check if the presale have started
  const checkIfPresaleStarted = async () => {
    try{
      // fetch the provider
      const provider = await getProviderOrSigner();

      // make an instance of the nftContract with the provider
      const nftContract = new Contract (
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // check if the presale have started
      const _presaleStarted = await nftContract.presaleStarted();
      if(!_presaleStarted){
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    }catch(err){
      console.error(err);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try{
      // get the provider
      const provider = await getProviderOrSigner();

      // initialize the nftContract with the provider
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider,
      );
      const _presaleEnded = await nftContract.presaleEnded();

      /**
       * _presaleEnded returns a big number which 
       * we would use the lt(less than function <). 
       * Date.now/1000 retruns the current time in seconds
       * soo we can just compare the _presaleEnded 
       * timestamp to see if it is less than current time
       * which would indicate that presale has ended
       */

      const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));
      if (hasEnded){
        setPresaleEnded(true);
      } else{
        setPresaleEnded(false);
      }
      return hasEnded;
    }catch(err){
      console.error(err);
      return false;
    }
  };

  const getOwner = async ()=>{
    try{
      // get the provider
      const provider = await getProviderOrSigner();

      // initialize the nftContract with the provider
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider,
      );

      // call the owner function from the contract
      const _owner = await nftContract.owner();

      // fetch the signer so that we can extract the 
      // address of the currently connected wallet
      const signer = await getProviderOrSigner(true);

      // now we extract the address
      const address = await signer.getAddress();
      if(address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }

    }catch(err){
      console.error(err.message);

    }
  };

  const getTokenIdsMinted = async () =>{
    try{
      // get the provider
      const provider = await getProviderOrSigner();

      // initialize the nftContract with the provider
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider,
      );
      const _tokenIds = await nftContract.tokenIds();

      // the tokenId is a Big Number, so we convert it to a string
      setTokenIdsMinted(_tokenIds.toString());
    }catch(err){
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) =>{
    // connect to the wallet
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // check if the user is connected to goerli network
    const { chainId } = await web3Provider.getNetwork();
    if ( chainId !== 5 ){
      window.alert(" Change the network to Goerli");
      throw new Error(" Change network to Goerli");
    }
    if (needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  useEffect(() => {
    // check if the use has a wallet connected as soon as the 
    // page loads
    if ( !walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      }); 
      connectWallet();
      
      //check if presale has started and ended
      const _presaleStarted = checkIfPresaleStarted();
      if(_presaleStarted){
        checkIfPresaleEnded
      }

      getTokenIdsMinted();

      // set a 5 minutes interval to check if presale has ended
      const presaleEndedInterval = setInterval(async function (){
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded){
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // get the number of tokenIds minted every 5 munites
      setInterval(async function(){
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  // diplay a button depending on the state of the dapp
  const renderButton = () =>{
    // check if wallwt is connected
    if(!walletConnected){
      return(
        <button onClick={ connectWallet} className = {styles.button}>
          Connect your wallet
        </button>
      )
    };
    // waiting for an action to complete in the background
    if(loading){
      return (
        <button className= { styles.button}>
          Loading...
        </button>
      )
    };

    // if connected user is owner and presale has not started yet
    if(isOwner && !presaleStarted){
      return(
        <button onClick = { startPresale} className = { styles.button}>
          Start Presale
        </button>
      )
    };
    // if connected user in tho the owner and presale has not started yet
   if(!presaleStarted){ 
    return (
      <div className={ styles.description}>
        Presale hasn't started yet
      </div>
    )};

    // if presale has started but has not ended yet,
    // user can mint NFT
    if(presaleStarted && !presaleEnded){
      return(
        <div>
        <div className = { styles.description}>
          Presale has started !!! If your address is whitelisted, Mint a Crytpo Dev NFT 🥳
        </div>
         <button className={styles.button}> Presale Mint 🚀 </button>
         </div>
      )
    }

    // if presale has started and has ended
    if(presaleStarted && presaleEnded){
      return(
        <button className = {styles.button} onClick = {publicMint}>
          Public Mint 🚀
        </button>
      )
    }
  }

  return (
  <div>
    <Head>
      <title>
        Crypto Devs
      </title>
      <meta name ="description" content = "Whitelist-Dapp"/>
      <link rel="icon" href ="/favicon.ico"/>
    </Head>
    <div className= {styles.main}>
      <div>
        <h1 className={styles.title}>
          Welcome to Crypto Devs
        </h1>
        <div className={styles.description}>
          It is an NFT collection for developers in Crypto
        </div>
        <div>
          {tokenIdsMinted} / 20 have been minted
        </div>
        {renderButton()}
      </div>
      <div>
        <img className= {styles.image} src = "./cryptodevs/0.svg"/>
      </div>
    </div>
    <footer className={ styles.footer}>
      Made with &#10084; by Mosnyik
    </footer>
  </div>
  );
}
