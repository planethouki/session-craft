const jose = require("node-jose");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

let privateKey = fs.readFileSync(path.join(__dirname, "assertion-priv.json"), "utf8");

let header = {
  alg: "RS256",
  typ: "JWT",
  kid: process.env.LINE_CHANNEL_KID,
};

let payload = {
  iss: process.env.LINE_CHANNEL_ID,
  sub: process.env.LINE_CHANNEL_ID,
  aud: "https://api.line.me/",
  exp: Math.floor(new Date().getTime() / 1000) + 60 * 30,
  token_exp: 60 * 60 * 24 * 30,
};

jose.JWS.createSign(
  { format: "compact", fields: header },
  JSON.parse(privateKey),
)
  .update(JSON.stringify(payload))
  .final()
  .then((result) => {
    console.log(result);
  });
