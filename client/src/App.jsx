import { useState } from "react";
import "./App.css";

import {
  Keypair,
  Horizon,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
} from "diamante-sdk-js";


function App() {
  const [issuer, setIssuer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [myAddress, setMyAddress] = useState("");
  const [assetName, setAssetName] = useState("");
  const [asset, setAsset] = useState("");

  const handleMakeIssuer = async () => {
    try {
      let headersList = {
        Accept: "*/*",
      };

      let response = await fetch("http://13.233.14.66:5000/create_issuer", {
        method: "GET",
        headers: headersList,
      });

      let data = await response.json();
      setIssuer(data.issuer);
    } catch (e) {
      console.log(e);
    }
  };

  const handleFundIssuer = async () => {
    const ext_resp = await window.diam.connect();
    if (ext_resp.status === 200) {
      setMyAddress(ext_resp.message[0]);

      const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
      const sourceAccount = await server.loadAccount(ext_resp.message[0]);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet",
      })
        .addOperation(
          Operation.createAccount({
            destination: issuer,
            startingBalance: "10",
          })
        )
        .setTimeout(0)
        .build();

      const xdr = transaction.toXDR("base64");

      const resp = await window.diam.sign(xdr, true, "Diamante Testnet");



      if (resp.response.status === 200) {
        alert("Issuer account active");
      } else {
        alert("Something went wrong!");
      }

      console.log(resp.toString(), "Checkkkkk");
    } else {
      alert("Error");
    }
  };

  const handleMintbtnClick = async () => {

    console.log("we have got it")
    let headersList = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };

    let bodyContent = JSON.stringify({
      asset_name: assetName,
    });

    let response = await fetch("http://13.233.14.66:5000/create_asset", {
      method: "POST",
      body: bodyContent,
      headers: headersList,
    });

    let data = await response.json();


    console.log(data, " data received")

    if (response.status !== 200) {
      alert("IA generation failed");


    }

    setAsset(assetName);


    const asset = new Asset(data.data.asset_name, data.data.issuer_address);

    const ext_resp = await window.diam.connect();
    const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
    const sourceAccount = await server.loadAccount(ext_resp.message[0]);

    var transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: "Diamante Testnet",
    })
      .addOperation(
        Operation.payment({
          destination: "GCH2IR3YYTLTON2AUV3NW56HTFJBDAPGIZIFDSHG4FQQ5COUVG3K2PGC",
          asset: Asset.native(),
          amount: "4",
        })
      )
      .addOperation(Operation.changeTrust({ asset }))

      .setTimeout(0)
      .build();

    var xdr = transaction.toXDR("base64");

    var resp = await window.diam.sign(xdr, true, "Diamante Testnet");
    if (resp.response.status !== 200) {
      alert("fee payment failed");
    }


    // if (response.status === 200) {

    if (resp.response.status === 200) {
      alert("Fee payment and trusline creation done");
    }
    // const server = new Horizon.Server("https://diamtestnet.diamcircle.io");


    // const receiverAddress = await server.loadAccount(myAddress);

    // const transaction = new TransactionBuilder(receiverAddress, {
    //   fee: BASE_FEE,
    //   networkPassphrase: "Diamante Testnet",
    // })
    //   .addOperation(Operation.changeTrust({ asset }))
    //   .setTimeout(0)
    //   .build();

    // const xdr = transaction.toXDR("base64");
    // const resp = await window.diam.sign(xdr, true, "Diamante Testnet");
    // if (resp.response.status === 200) {
    //   alert("Trustline created for asset ", data.data.asset_name);
    // }
    // }
  };

  const handleTransferAsset = async () => {
    let headersList = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };

    let bodyContent = JSON.stringify({
      address: myAddress,
      asset_name: asset,
    });

    console.log(asset)

    let response = await fetch("http://13.233.14.66:5000/mint_asset", {
      method: "POST",
      body: bodyContent,
      headers: headersList,
    });

    let data = await response.text();
    console.log(data);
  };

  return (
    <>
      <button onClick={handleMakeIssuer}>Make Issuer</button>
      {issuer && <div>Issuer is {issuer}</div>}

      <button onClick={handleFundIssuer}>Fund Issuer</button>

      <form>
        <input
          type="text"
          value={assetName}
          onChange={(e) => {
            setAssetName(e.target.value);
          }}
        />
        <button type="button" onClick={handleMintbtnClick}>
          create Asset
        </button>
      </form>

      <button type="button" onClick={handleTransferAsset}>
        mint asset
      </button>
    </>
  );
}

export default App;
