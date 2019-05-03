const StellarSdk = require("stellar-sdk");
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

class TxBuilder {

    constructor(account) {
        this.account = account;
        this.builder = null;
    }

    async generateBuilder() {
        this.account = await server.loadAccount(this.account);
        const fee = await server.fetchBaseFee();
        this.builder = new StellarSdk.TransactionBuilder(this.account, { fee });
    }

    addPaymentOperation(destination, amount) {
        const newBuilder = this.builder
            .addOperation(
                StellarSdk.Operation.payment({
                    destination, amount, asset: StellarSdk.Asset.native()                
                })
            );
        this.builder = newBuilder;
    }

    addOptionOperation(options) {
        const newBuilder = this.builder
            .addOperation(StellarSdk.Operation.setOptions(options));
        this.builder = newBuilder;
    }

    addAccountCreationOption({ destination, amount }) {
        const newBuilder = this.builder
            .addOperation(StellarSdk.Operation.createAccount({ 
                destination, startingBalance: amount 
            }));
        this.builder = newBuilder;
    }

    addTimeout() {
        this.builder = this.builder.setTimeout(0);
    }
    
    buildTransaction() {
        return this.builder.build();
    }

}

module.exports = TxBuilder;