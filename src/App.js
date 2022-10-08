// App.js
import myEpicNft from "./utils/MyEpicNFT.json";
import { ethers } from "ethers";
// useEffect と useState 関数を React.js からインポートしています。
import React, { useEffect, useState } from "react";
import "./styles/App.css";
import "./styles/animation.css";
import twitterLogo from "./assets/twitter-logo.svg";
// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = "danchinocto";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 20;

// コトントラクトアドレスをCONTRACT_ADDRESS変数に格納
const CONTRACT_ADDRESS = "0x7ecF4556f737be760Ab8E18cDe9c52508F487145";

const App = () => {
  // ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentTokenId, setCurrentTokenId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInGoerli, setIsInGoerli] = useState(false);

  // setupEventListener 関数を定義します。
  // MyEpicNFT.sol の中で event が　emit された時に、
  // 情報を受け取ります。
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // let currentTokenId = await connectedContract.tokenCount();
        
        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          // setCurrentTokenId(tokenId.toNumber());
          alert(
            `あなたのウォレットに NFT を送信しました。OpenSea に表示されるまで最大で10分かかることがあります。NFT へのリンクはこちらです: https://testnets.opensea.io/assets/goerli/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ユーザーが認証可能なウォレットアドレスを持っているか確認します。
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);
    // 0x5 は　Goerli の ID です。
    const goerliChainId = "0x5";
    let isInGoerliByChainId = chainId === goerliChainId;
    setIsInGoerli(isInGoerliByChainId);
    
    // if (chainId !== goerliChainId) {
    if (!isInGoerliByChainId) {
      alert("You are not connected to the Goerli Test Network!");
    }

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // ユーザーが認証可能なウォレットアドレスを持っている場合は、ユーザーに対してウォレットへのアクセス許可を求める。許可されれば、ユーザーの最初のウォレットアドレスを accounts に格納する。
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      // イベントリスナーを設定
      // この時点で、ユーザーはウォレット接続が済んでいます。
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  // connectWallet メソッドを実装します。
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // ウォレットアドレスに対してアクセスをリクエストしています。
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);

      // ウォレットアドレスを currentAccount に紐付けます。
      setCurrentAccount(accounts[0]);

      // イベントリスナーを設定
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // NFT を Mint する関数を定義しています。
  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();
        setIsLoading(true);
        console.log("Mining...please wait.");
        await nftTxn.wait();

        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
        );
        setCurrentTokenId((prevCurrentTokenId) => prevCurrentTokenId + 1);
        setIsLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGetNftCount = async (connectedContract) => {
    const id = await connectedContract.getNftCount();
    if (!id) return;
    setCurrentTokenId(id.toNumber() - 1);
    console.log(currentTokenId);
  }

  // ページがロードされた際に下記が実行されます。
  useEffect(() => {
    checkIfWalletIsConnected();
    // handleGetNftCount();
  }, []);

  // useEffect(() => {
  //   if (!currentTokenId) return;
  //   setCurrentTokenId(currentTokenId);
  //   handleGetNftCount();
  // }, [currentTokenId]);

  // renderNotConnectedContainer メソッド（ Connect to Wallet を表示する関数）を定義します。
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );
 
  // Mint NFT ボタンをレンダリングするメソッドを定義します。
  const renderMintUI = () => (
    <button
    onClick={askContractToMintNft}
    className="cta-button connect-wallet-button"
    >
      Mint NFT
    </button>
  );

  const renderLinkToOpenSeaUI = () => (
    <button
    onClick="location.href='google.com'"
    className="cta-button connect-wallet-button"
    >
      See the NFT collection at OpenSea
    </button>
  );

  const renderLoading = () => (
    <div className="wrapper">
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
        {/* <span>Loading</span> */}
    </div>
  );
  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          {/*条件付きレンダリング。
          // すでにウォレット接続されている場合は、
        // Mint NFT を表示する。*/}
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : !isLoading
            ? renderMintUI()
            : renderLoading() }
        </div>
        <div className="text-white"> 
          {/* <p>{`${
            currentTokenId === 0 ? "x" : currentTokenId
          }/${TOTAL_MINT_COUNT}`}</p> */}
          {/* <p>NFT counter: {currentTokenId} / {TOTAL_MINT_COUNT}</p> */}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;