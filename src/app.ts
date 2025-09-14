import { S3 } from '@aws-sdk/client-s3';
import { promises as dnsPromises } from 'node:dns';

const S3_BUCKET_NAME = 'tscs-demo-bucket-684209394034-us-east-2';

async function testS3() {
    console.log('AWS S3 [Gateway Endpoint]');
    const dnsResult = await dnsPromises.lookup('s3.us-east-2.amazonaws.com');
    console.log('s3.us-east-2.amazonaws.com:', dnsResult.address);

    const s3 = new S3({
        region: 'us-east-2'
    });

    const key = crypto.randomUUID();

    const putObject = await s3.putObject({ Bucket: S3_BUCKET_NAME, Key: key, Body: 'Hello World!' });
    console.log('Put Object:', key, putObject.$metadata.httpStatusCode);

    const getObject = await s3.getObject({ Bucket: S3_BUCKET_NAME, Key: key });
    getObject.Body?.transformToString().then((data) => {
        console.log('Get Object:', key, data);
    });
}

async function main() {
    await testS3();
    console.log();
}

main().catch(err => console.error(err));
