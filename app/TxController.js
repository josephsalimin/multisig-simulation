const TxBuilder = require("./TxBuilder");
const DB = require("./DatabaseManager");
const TxHelper = require("./TxHelper");
const axios = require("axios");

class TransactionController {

    async createNewAccount(request, response) {
        const username = request.body.username;
        const db = await DB.database();
        const keyPair = TxHelper.generateKeyPair();
        const pubKey = keyPair.publicKey();
        const secretKey = keyPair.secret();
        // Initial fund for testing
        const resp = await axios.get(`https://horizon-testnet.stellar.org/friendbot?addr=${pubKey}`);
        // Save to user
        await db.run(
            "INSERT INTO users (username, private_key, public_key) VALUES (?, ?, ?)",
            username, secretKey, pubKey);
        return response.status(201).json({
            type: keyPair.type,
            public: pubKey,
            secret: secretKey,
            data: resp.data
        });
    }

    async initiateNewEscrow(request, response) {
        const db = await DB.database();
        const { initiator } = request.body;
        const user = await db.get(
            `SELECT * FROM users WHERE id = ?`, initiator);
        // Generate new escrow
        const keyPair = TxHelper.generateKeyPair();
        const pubKey = keyPair.publicKey();
        const secretKey = keyPair.secret();
        // Send money to escrow
        const builder = new TxBuilder(user.public_key);
        await builder.generateBuilder();
        builder.addAccountCreationOption({ 
            destination: pubKey,
            amount: "21"
        });
        builder.addTimeout();
        const transaction = builder.buildTransaction();
        transaction.sign(TxHelper.getKeyPairFromSecret(user.private_key));
        await TxHelper.submitTx(transaction);
        // Insert to db
        await db.run(
            "INSERT INTO escrows (private_key, public_key, user_initiator) VALUES (?, ?, ?)",
            secretKey, pubKey, initiator);
        return response.status(201).json({
            escrow_pub_key: pubKey,
            escrow_secret_key: secretKey
        });
    }

    async addParticipators(request, response) {
        const db = await DB.database();
        const { escrow_id, participators } = request.body;
        const users = await db.all(
            `SELECT * FROM users WHERE id in (${participators.map(() => "?").join(", ")})`, 
            participators);
        const escrow = await db.get(
            `SELECT * FROM escrows where id = ?`, escrow_id);
        if (escrow && users.length === participators.length) {
            // Generate builder with its options
            const builder = new TxBuilder(escrow.public_key);
            await builder.generateBuilder();
            builder.addOptionOperation({
                masterWeight: 1
            });
            for (const user of users) {
                builder.addOptionOperation({
                    signer: { ed25519PublicKey: user.public_key, weight: 1 }
                });
            }
            builder.addOptionOperation({
                lowThreshold: participators.length,
                medThreshold: participators.length,
                highThreshold: participators.length
            });
            builder.addTimeout();
            // Generate transaction
            const transaction = builder.buildTransaction();
            transaction.sign(TxHelper.getKeyPairFromSecret(escrow.private_key));
            const envelope = transaction.toEnvelope().toXDR("base64");
            await TxHelper.submitTx(transaction);
            // Update escrow
            await db.run(
                "UPDATE escrows SET participators = ? WHERE id = ?", participators.join(","), escrow_id);
            return response.json({
                xdr: envelope
            });
        } else {
            return response.status(400).json({
                message: "error",
            });
        }
    }

    async sendFund(request, response) {
        const db = await DB.database();
        const { user_id, escrow_id, amount } = request.body;
        const user = await db.get(
            `SELECT * FROM users WHERE id = ?`, user_id);
        const escrow = await db.get(
            `SELECT * FROM escrows where id = ?`, escrow_id);
        // Tx Builder
        const builder = new TxBuilder(user.public_key);
        await builder.generateBuilder();
        builder.addPaymentOperation(escrow.public_key, amount);
        builder.addTimeout();
        // Generate Transaction
        const transaction = builder.buildTransaction();
        transaction.sign(TxHelper.getKeyPairFromSecret(user.private_key));
        const envelope = transaction.toEnvelope().toXDR("base64");
        await TxHelper.submitTx(transaction);
        return response.json({ xdr: envelope });
    }

    async initiateWithdrawal(request, response) {
        const db = await DB.database();
        const { user_id, escrow_id, amount } = request.body;
        const user = await db.get(
            `SELECT * FROM users WHERE id = ?`, user_id);
        const escrow = await db.get(
            `SELECT * FROM escrows where id = ?`, escrow_id);
        // Tx Builder
        const builder = new TxBuilder(escrow.public_key);
        await builder.generateBuilder();
        builder.addPaymentOperation(user.public_key, amount);
        builder.addTimeout();
        // Generate Transaction
        const transaction = builder.buildTransaction();
        transaction.sign(TxHelper.getKeyPairFromSecret(user.private_key));
        // Create temporary data to save xdr in database
        const envelope = transaction.toEnvelope().toXDR("base64");
        const totalSigned = escrow.participators.split(",").length
        await db.run(
            "INSERT INTO txs (xdr_text, signed, total_signed, finished, escrow_id) VALUES (?, ?, ?, ?, ?)",
            envelope, 1, totalSigned, false, escrow.id);
        return response.json({
            xdr: envelope,
            signed : 1,
            total_signed: totalSigned,
            escrow_id: escrow.id,
            finished: false
        });
    }

    async sign(request, response) {
        const db = await DB.database();
        const { tx_id, user_id } = request.body;
        const user = await db.get(
            `SELECT * FROM users WHERE id = ?`, user_id);
        const tx = await db.get(
            `SELECT * FROM txs where id = ?`, tx_id);
        const transaction = TxHelper.createTxFromEnvelope(tx.xdr_text);
        transaction.sign(TxHelper.getKeyPairFromSecret(user.private_key));
        tx.signed += 1;
        if (tx.signed === tx.total_signed) {
            tx.finished = true;
            await TxHelper.submitTx(transaction);
        }
        await db.run(
            "UPDATE txs set signed = ?, finished = ? WHERE id = ?",
            tx.signed, tx.finished, tx_id);
        return response.json(tx);
    }

}

const txController = new TransactionController();

module.exports = txController;