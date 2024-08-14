In application issuer wallet will be generated and stored in server in a file called keypair.json, user needs to activate this account in the application using diam wallet extension. Once issuer account is setup, any user can come to application and create their asset, create asset involves paying fee to issuer and creating trustline (NOTE: after create asset is triggered, app will wait for some time to get responce from server, to trigger the extension).
Once the asset is created, on mint button the asset will be transffered to the users wallet

(NOTE: ASSET created its metadata are stored in it issuer account, json data are added to IPFS and THECID is stored in asset issuer account. In this demonstration we create a object with field  metadataFormat.owner = USER_ADDRESS. )


On verification, wallet will be connected, and assets held by the wallet is  rendered, when an asset is selected, it is checked if it was creted by an IA account created by issuer wallet and decode the metadat to check if this asset is minted for this wallet or not


To run client, 
cd client
yarn (to install dependencies) 
yarn dev (to run the project)


To run server, 
cd server
npm i (to install dependencies) 
node index.js (to run the project)


To run verfier, 
run using live server
