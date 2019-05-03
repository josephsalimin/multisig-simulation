-- Up
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    private_key TEXT,
    public_key TEXT
);

CREATE TABLE escrows (
    id INTEGER PRIMARY KEY,
    private_key TEXT,
    public_key TEXT,
    user_initiator INTEGER,
    participators TEXT
);

CREATE TABLE txs (
    id INTEGER PRIMARY KEY,
    xdr_text TEXT,
    total_signed INTEGER DEFAULT 0,
    finished INTEGER DEFAULT 0
);

-- Down
DROP TABLE users;
DROP TABLE escrows;
DROP TABLE txs;