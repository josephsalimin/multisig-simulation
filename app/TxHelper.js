const StellarSdk = require("stellar-sdk");
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

class TxHelper {

    static getKeyPairFromSecret(secret) {
        return StellarSdk.Keypair.fromSecret(secret);
    }
    
    static createTxFromEnvelope(envelope) {
        return new StellarSdk.Transaction(envelope);
    }

    static async submitTx(transaction) {
        return await server.submitTransaction(transaction);
    }

    static generateKeyPair() {
        return StellarSdk.Keypair.random();
    }

    static async sendInitialFund(pubKey) {
        return await server.friendbot(pubKey)
    }

}

module.exports = TxHelper;