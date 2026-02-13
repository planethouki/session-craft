# session-craft

## 自己署名証明書でhttps

```
mkdir -p certs

cat > certs/localhost-openssl.cnf <<'EOF'
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
x509_extensions    = v3_req
distinguished_name = dn

[dn]
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1  = 127.0.0.1
EOF

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/localhost-key.pem \
  -out certs/localhost-cert.pem \
  -days 365 \
  -config certs/localhost-openssl.cnf
```

## IAM
`<number>-compute@developer.gserviceaccount.com` に `サービス アカウント トークン作成者` を付与
