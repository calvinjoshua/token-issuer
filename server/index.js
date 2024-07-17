const express = require("express");
const diamSdk = require("diamante-sdk-js");
const fs = require("fs");
const cors = require("cors");
const { error } = require("console");
const { create } = require('ipfs-http-client');
// const create = require('kubo-rpc-client')

// const client = create({ url: "https://uploadipfs.diamcircle.io" });
const client = create(new URL("https://uploadipfs.diamcircle.io"))


var intermediary_keypair;
// var intermediary_keypair = diamSdk.Keypair.fromSecret("SDFKGRRQIX5HFEICU6SYPYRXMVS6MQUETU5KIP3JVKTCTM3UCDV7TJG4");
//GDLFF2K6CRSGQ322H6ND2XYXMXG2EMOZB2G4KKGSP5PPZSUYT3C3SIAY SBHQSCE3TDIWCOIS6EO44P7IOWUV6FWXRJNSVLKTZ6JNVE2YMCZWYKS2
// const intermediary_keypair = diamSdk.Keypair.fromSecret("SDVQ742V2GZZBAIKUKG7DET55KQOMS633A4FXE67Q2C7TZEI4IQWQBRH");


const app = express();
app.use(express.json());

app.use(cors());

app.get("/create_issuer", (req, res) => {
  const keypair = diamSdk.Keypair.random();




  const keys_object = {
    public_key: keypair.publicKey(),
    private_key: keypair.secret(),
  };



  const keys = JSON.stringify(keys_object);

  fs.writeFile("keypair.json", keys, "utf8", (err) => {
    if (err) {
      console.log("Error while writing to the file:", err);
    } else {
      console.log("Successfully wrote to the file.");
    }
  });

  res.send({
    issuer: keypair.publicKey(),
  });
});

app.post("/get-dapp-owner-account", (req, res) => {

  // intermediary_keypair = diamSdk.Keypair.random();


  try {
    let keys;
    fs.readFile("keypair.json", "utf8", async (err, data) => {
      if (err) {
        res.send({
          error: "Error reading file",
          data: null,
        });
      } else {
        keys = JSON.parse(data);
        res.send({
          error: null,
          data: {
            // intermediar_address: intermediary_keypair.publicKey(),
            dapp_owner: keys.public_key
          },
        });
      }
    })

  } catch (e) {
    res.send({
      error: e,
      data: null,
    });
  }

})



app.post("/create_asset", (req, res) => {
  const asset_name = req.body.asset_name;

  intermediary_keypair = diamSdk.Keypair.random();

  console.log(intermediary_keypair.publicKey(), intermediary_keypair.secret())

  let keys;
  fs.readFile("keypair.json", "utf8", async (err, data) => {
    if (err) {
      res.send({
        error: "Error reading file",
        data: null,
      });
    } else {
      keys = JSON.parse(data);
      try {
        const server = new diamSdk.Horizon.Server(
          "https://diamtestnet.diamcircle.io"
        );
        const sourceAccount = await server.loadAccount(keys.public_key);
        const sourceKeypair = diamSdk.Keypair.fromSecret(keys.private_key);

        const transaction = new diamSdk.TransactionBuilder(sourceAccount, {
          fee: diamSdk.BASE_FEE,
          networkPassphrase: "Diamante Testnet",
        })
          .addOperation(
            diamSdk.Operation.createAccount({
              destination: intermediary_keypair.publicKey(),
              startingBalance: "4",
            })
          )
          .setTimeout(0)
          .build();

        transaction.sign(sourceKeypair);
        const resp = await server.submitTransaction(transaction);
        if (resp.successful == true) {
          console.log("Succesfull!!");
          res.send({
            error: null,
            data: {
              asset_name: asset_name,
              // issuer_address: intermediary_keypair.publicKey(),
              intermediary_address: intermediary_keypair.publicKey()
            },
          });
        } else {
          res.send({
            error: "Transaction failed",
            data: null,
          });
        }
      } catch (e) {
        res.send({
          error: e,
          data: null,
        });
      }
    }
  });
});

app.post("/mint_asset", async (req, res) => {



  const receiver_addr = req.body.address;
  const asset_name = req.body.asset_name;


  console.log(receiver_addr + " 11111111111", intermediary_keypair.publicKey())

  try {
    const server = new diamSdk.Horizon.Server(
      "https://diamtestnet.diamcircle.io"
    );

    console.log(asset_name, "asset name")

    const account = await server.loadAccount(intermediary_keypair.publicKey());
    const _asset = new diamSdk.Asset(
      asset_name,
      intermediary_keypair.publicKey()
    );

    var metadataFormat = {}

    metadataFormat.owner = receiver_addr


    const metadataJSON = JSON.stringify(metadataFormat);
    const { cid } = await client.add(metadataJSON)

    //in metadata other fields supporting the asset can be added

    // const { cid } = await client.add('Hello world!')

    console.log('metadata uploaded successfully. IPFS hash:', cid.toString());

    // return
    // return result.path;
    const transaction = new diamSdk.TransactionBuilder(account, {
      fee: diamSdk.BASE_FEE,
      networkPassphrase: "Diamante Testnet",
    })
      .addOperation(
        diamSdk.Operation.payment({
          destination: receiver_addr,
          asset: _asset,//diamSdk.Asset.native(),
          amount: "0.0000001",
        })
      )
      .addOperation
      (
        diamSdk.Operation.manageData({
          name: asset_name,
          value: cid.toString()
        })
      )
      .addOperation(
        diamSdk.Operation.setOptions({
          masterWeight: 0,
        })
      )
      .setTimeout(100)
      .build();

    transaction.sign(intermediary_keypair);
    const result = await server.submitTransaction(transaction);
    if (result.successful === true) {
      res.send({
        error: null,
        data: "Asset transfered",
      });
    }
  } catch (e) {
    console.log(e);
    res.send({
      error: e,
      data: null,
    });
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 3000");
});
