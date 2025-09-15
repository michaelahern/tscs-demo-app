import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { KMS } from '@aws-sdk/client-kms';
import { S3 } from '@aws-sdk/client-s3';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { promises as DNS } from 'node:dns';
import { Client as Postgres } from 'pg';

const DYNAMODB_TABLE_NAME = 'tscs-demo-table-684209394034-us-east-2';
const DYNAMODB_VPCE_HOSTNAME = 'vpce-05a34e75b50424ab0-lmwrdzf5.dynamodb.us-east-2.vpce.amazonaws.com';
const KMS_KEY_ALIAS = 'tscs-demo-key-684209394034-us-east-2';
const RDS_SECRET_NAME = 'AuroraClusterSecret8E4F2BC8-3XcGTtJyKDpt';
const S3_BUCKET_NAME = 'tscs-demo-bucket-684209394034-us-east-2';

async function testDynamoDB() {
    console.log('AWS DynamoDB [Interface Endpoint]');

    try {
        const dnsResult = await DNS.lookup(DYNAMODB_VPCE_HOSTNAME);
        console.log(`${DYNAMODB_VPCE_HOSTNAME}:`, dnsResult.address);

        const dynamodb = new DynamoDB({
            region: 'us-east-2',
            endpoint: `https://${DYNAMODB_VPCE_HOSTNAME}`,
            requestHandler: new NodeHttpHandler({
                connectionTimeout: 5000,
                socketTimeout: 5000
            })
        });

        const key = crypto.randomUUID();

        const putItem = await dynamodb.putItem({
            TableName: DYNAMODB_TABLE_NAME,
            Item: {
                id: { S: key },
                value: { S: 'Hello World' }
            }
        });
        console.log('Put Item:', key, putItem.$metadata.httpStatusCode);

        const getItem = await dynamodb.getItem({
            TableName: DYNAMODB_TABLE_NAME,
            Key: {
                id: { S: key }
            }
        });
        console.log('Get Item:', getItem.Item);
    }
    catch (err: unknown) {
        console.error(err instanceof Error ? err.message : err);
    }
}

async function testKMS() {
    console.log('AWS KMS [Interface Endpoint with VPC Private DNS]');

    try {
        const dnsResult = await DNS.lookup('kms.us-east-2.amazonaws.com');
        console.log(`kms.us-east-2.amazonaws.com:`, dnsResult.address);

        const kms = new KMS({
            region: 'us-east-2'
        });

        const dek = await kms.generateDataKey({ KeyId: `alias/${KMS_KEY_ALIAS}`, KeySpec: 'AES_256' });
        console.log('Generate Data Key:', dek.KeyId, dek.$metadata.httpStatusCode, Buffer.from(dek.Plaintext ?? '').toString('base64'));
    }
    catch (err: unknown) {
        console.error(err instanceof Error ? err.message : err);
    }
}

async function testRDS() {
    console.log('AWS RDS Aurora Serverless v2 [Elastic Network Interface]');

    try {
        const secretsManager = new SecretsManager({ region: 'us-east-2' });
        const secret = await secretsManager.getSecretValue({ SecretId: RDS_SECRET_NAME });
        if (secret.SecretString === undefined) throw new Error('Database credentials not accessible...');
        const credentials = JSON.parse(secret.SecretString);
        console.log('Credentials:', credentials);

        const client = new Postgres({
            host: credentials.host,
            port: credentials.port,
            user: credentials.username,
            password: credentials.password,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        await client.connect();
        const result = await client.query('SELECT version()');
        console.log('SELECT version():', result.rows[0].version);
        await client.end();
    }
    catch (err: unknown) {
        console.error(err instanceof Error ? err.message : err);
    }
}

async function testS3() {
    console.log('AWS S3 [Gateway Endpoint]');

    try {
        const dnsResult = await DNS.lookup('s3.us-east-2.amazonaws.com');
        console.log('s3.us-east-2.amazonaws.com:', dnsResult.address);

        const s3 = new S3({
            region: 'us-east-2'
        });

        const key = crypto.randomUUID();

        const putObject = await s3.putObject({ Bucket: S3_BUCKET_NAME, Key: key, Body: 'Hello World!' });
        console.log('Put Object:', key, putObject.$metadata.httpStatusCode);

        const getObject = await s3.getObject({ Bucket: S3_BUCKET_NAME, Key: key });
        const getObjectBody = await getObject.Body?.transformToString();
        console.log('Get Object:', key, getObjectBody);
    }
    catch (err: unknown) {
        console.error(err instanceof Error ? err.message : err);
    }
}

async function main() {
    await testDynamoDB();
    console.log();
    await testKMS();
    console.log();
    await testRDS();
    console.log();
    await testS3();
}

main().catch(err => console.error(err));
