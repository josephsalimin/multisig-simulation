const TxBuilder = require("./TxBuilder");
const TxHelper = require("./TxHelper");

const acc = "GBEZIQW6AMYVVIFGCFNKF4XN2TTUHA75VN37EV6TOOK6EVWGFXXLCWB7";
const secret = "SDQ7363N46IMV6DBOZD4O6BYLPNTEQWGMZPIVDOGJAIVXQHLIBANTF52";

async function testTransactionBuilder() {
    const builder = new TxBuilder(acc);
    await builder.generateBuilder();
    builder.addOptionOperation({ masterWeight: 2 });
    builder.addTimeout();
    const transaction = builder.buildTransaction();
    transaction.sign(TxHelper.getKeyPairFromSecret(secret));
    const envelope = transaction.toEnvelope().toXDR("base64");
    const newTx = TxHelper.createTxFromEnvelope(envelope);
    const res = await TxHelper.submitTx(newTx);
    console.log(envelope);
    console.log(res);
}

(async function main() {
    await testTransactionBuilder();
})()