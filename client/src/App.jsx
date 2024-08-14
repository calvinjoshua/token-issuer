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
  const [message, setmessage] = useState("");
  const [myAddress, setMyAddress] = useState("");
  const [assetName, setAssetName] = useState("");
  const [asset, setAsset] = useState("");

  const [loading, setLoading] = useState(false);

  const handleMakeIssuer = async () => {

    setLoading(true)
    setmessage("creating issuer keypair for dapp owner")
    try {
      let headersList = {
        Accept: "*/*",
      };

      let response = await fetch("http://localhost:5000/create_issuer", {
        method: "GET",
        headers: headersList,
      });

      let data = await response.json();
      setIssuer(data.issuer);
      setLoading(false)

    } catch (e) {
      console.log(e);
      setLoading(false)

    }
  };

  const handleFundIssuer = async () => {


    const ext_resp = await window.diam.connect();
    if (ext_resp.status === 200) {

      setLoading(true)
      setmessage("funding issuer keypair")
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
            startingBalance: "5",
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

      console.log(resp.toString(), "Check status");

      setLoading(false)
    } else {
      alert("Error");
      setLoading(false)
    }
  };

  const handleMintbtnClick = async () => {
    const ext_resp = await window.diam.connect();
    if (ext_resp.status !== 200) {
      alert("Something went wrong opening extension")

    }

    setLoading(true)
    setmessage("fetching issuer pubic address to pay the fee")
    // setMyAddress(ext_resp.message[0]);

    var headersList = {
      "Accept": "*/*",
    }

    var response = await fetch("http://localhost:5000/get-dapp-owner-account", {
      method: "POST",
      headers: headersList
    });

    var data = await response.json();
    console.log("dapp issuer address received ", data.data);




    const server = new Horizon.Server("https://diamtestnet.diamcircle.io");
    const sourceAccount = await server.loadAccount(ext_resp.message[0]);

    const feeStats = await server.feeStats()

    // console.log(feeStats.last_ledger_base_fee, " check importanat")
    const baseFeeJots = feeStats.last_ledger_base_fee;
    const baseFee = baseFeeJots / 10 ** 7;


    // net fee + 1 diam + 3 * net fee


    var transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: "Diamante Testnet",
    })
      .addOperation(
        Operation.payment({
          destination: data.data.dapp_owner, //
          asset: Asset.native(),
          amount: (3 + parseFloat(baseFee * 6)).toString(), // 1 DIAM for base reserve and adding extra base fee, incase base fee increase during IA creation
        })
      )
      //  .addOperation(Operation.changeTrust({ asset }))

      .setTimeout(0)
      .build();

    var xdr = transaction.toXDR("base64");

    var resp = await window.diam.sign(xdr, true, "Diamante Testnet");
    if (resp.response.status !== 200) {
      alert("fee payment failed");
    }


    // if (response.status === 200) {

    if (resp.response.status === 200) {
      alert("Fee payment done");
    }

    headersList = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };

    var bodyContent = JSON.stringify({
      asset_name: assetName,
    });

    setmessage("creating IA account with the fee paid")
    response = await fetch("http://localhost:5000/create_asset", {
      method: "POST",
      body: bodyContent,
      headers: headersList,
    });

    data = await response.json();


    console.log(data, " data received", ext_resp.message[0])

    if (response.status !== 200) {
      alert("IA generation failed");
    }


    setAsset(assetName);

    const asset = new Asset(data.data.asset_name, data.data.intermediary_address);
    setLoading(false)

    const receiverAddress = await server.loadAccount(ext_resp.message[0]);
    setMyAddress(ext_resp.message[0]);


    transaction = new TransactionBuilder(receiverAddress, {
      fee: BASE_FEE,
      networkPassphrase: "Diamante Testnet",
    })
      .addOperation(Operation.changeTrust({ asset }))
      .setTimeout(0)
      .build();

    xdr = transaction.toXDR("base64");
    resp = await window.diam.sign(xdr, true, "Diamante Testnet");
    if (resp.response.status === 200) {
      alert("Trustline created for asset ", data.data.asset_name);
    }
  }


  const handleTransferAsset = async () => {

    setLoading(true)
    setmessage("minting the asset from IA to user account ")
    let headersList = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };

    console.log(myAddress, " heheh")

    let bodyContent = JSON.stringify({
      address: myAddress,
      asset_name: asset,
    });

    console.log(asset)

    let response = await fetch("http://localhost:5000/mint_asset", {
      method: "POST",
      body: bodyContent,
      headers: headersList,
    });

    let data = await response.json();
    console.log(data);

    if (data.data === "Asset transfered") {
      setmessage("Asset Minted")
    }
  };

  // return (
  //   <>
  //     <button onClick={handleMakeIssuer}>Make Issuer</button>
  //     {issuer && <div>Issuer is {issuer}</div>}

  //     <button onClick={handleFundIssuer}>Fund Issuer</button>

  //     <form>
  //       <input
  //         type="text"
  //         value={assetName}
  //         onChange={(e) => {
  //           setAssetName(e.target.value);
  //         }}
  //       />
  //       <button type="button" onClick={handleMintbtnClick}>
  //         create Asset
  //       </button>
  //     </form>

  //     <button type="button" onClick={handleTransferAsset}>
  //       mint asset
  //     </button>
  //   </>
  // );
  return (
    <>
      <button onClick={handleMakeIssuer} style={{ marginBottom: '10px' }}>
        Make Issuer
      </button>
      {issuer && <div>Issuer is {issuer}</div>}

      <button onClick={handleFundIssuer} style={{ marginBottom: '10px' }}>
        Fund Issuer
      </button>

      <form>
        <input
          type="text"
          value={assetName}
          onChange={(e) => {
            setAssetName(e.target.value);
          }}
          style={{ marginRight: '10px' }}
        />
        <button type="button" onClick={handleMintbtnClick}>
          Create Asset
        </button>
      </form>

      <button type="button" onClick={handleTransferAsset} style={{ marginTop: '10px' }}>
        Mint Asset
      </button>

      {loading && (
        <div style={{ marginTop: '20px', color: 'blue' }}>
          {message}
        </div>
      )}
    </>
  );

}

export default App;

