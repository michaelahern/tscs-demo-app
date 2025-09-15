# Tailscale/Codespaces Cloud Native Dev Demo

A demo of using Tailscale and GitHub Codespaces for AWS cloud native development.

## The Demo

```bash
$ sudo tailscale up
$ npm run app
AWS DynamoDB [Interface Endpoint]
vpce-05a34e75b50424ab0-lmwrdzf5.dynamodb.us-east-2.vpce.amazonaws.com: 172.24.4.49
Put Item: 456f6395-9355-42d5-bc03-16d5c9627c21 200
Get Item: {
  id: { S: '456f6395-9355-42d5-bc03-16d5c9627c21' },
  value: { S: 'Hello World' }
}

AWS KMS [Interface Endpoint with VPC Private DNS]
kms.us-east-2.amazonaws.com: 172.24.3.88
Generate Data Key: arn:aws:kms:us-east-2:684209394034:key/42160ee4-dd47-4056-8807-46c3fb1563cb 200 O/IplKYsyCXVXkE1PyvLL+1+ShV8/eVBzjNzvBgvhYE=

AWS RDS Aurora Serverless v2 [Elastic Network Interface]
Credentials: {
  dbClusterIdentifier: 'tscsdemoresources-auroracluster23d869c0-zewf9iy1p127',
  password: '...',
  engine: 'postgres',
  port: 5432,
  host: 'tscsdemoresources-auroracluster23d869c0-zewf9iy1p127.cluster-cfrzvxfd157v.us-east-2.rds.amazonaws.com',
  username: 'postgres'
}
tscsdemoresources-auroracluster23d869c0-zewf9iy1p127.cluster-cfrzvxfd157v.us-east-2.rds.amazonaws.com: 172.24.5.16
SELECT version(): PostgreSQL 17.5 on aarch64-unknown-linux-gnu, compiled by aarch64-unknown-linux-gnu-gcc (GCC) 10.5.0, 64-bit

AWS S3 [Gateway Endpoint]
s3.us-east-2.amazonaws.com: 52.219.111.65
Put Object: 4eb12306-e235-4400-9bba-979716b130aa 200
Get Object: 4eb12306-e235-4400-9bba-979716b130aa Hello World!

$ sudo tailscale down
$ npm run app
AWS DynamoDB [Interface Endpoint]
vpce-05a34e75b50424ab0-lmwrdzf5.dynamodb.us-east-2.vpce.amazonaws.com: 172.24.5.185
Socket timed out without establishing a connection within 5000 ms

AWS KMS [Interface Endpoint with VPC Private DNS]
kms.us-east-2.amazonaws.com: 3.146.14.233
User: arn:aws:iam::684209394034:user/me is not authorized to perform: kms:GenerateDataKey on resource: arn:aws:kms:us-east-2:684209394034:key/42160ee4-dd47-4056-8807-46c3fb1563cb with an explicit deny in a resource-based policy

AWS RDS Aurora Serverless v2 [Elastic Network Interface]
Credentials: {
  dbClusterIdentifier: 'tscsdemoresources-auroracluster23d869c0-zewf9iy1p127',
  password: '...',
  engine: 'postgres',
  port: 5432,
  host: 'tscsdemoresources-auroracluster23d869c0-zewf9iy1p127.cluster-cfrzvxfd157v.us-east-2.rds.amazonaws.com',
  username: 'postgres'
}
tscsdemoresources-auroracluster23d869c0-zewf9iy1p127.cluster-cfrzvxfd157v.us-east-2.rds.amazonaws.com: 172.24.5.16
timeout expired

AWS S3 [Gateway Endpoint]
s3.us-east-2.amazonaws.com: 52.219.229.137
User: arn:aws:iam::684209394034:user/me is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::tscs-demo-bucket-684209394034-us-east-2/26289a63-da13-48e5-ae30-1ecc318162ea" with an explicit deny in a resource-based policy
```
