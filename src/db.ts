import * as AWS from 'aws-sdk';
import { PackageVersion } from './types';

// AWS.config.update({
//   region: 'us-east-2',
//   dynamodb: {
//     endpoint: 'http://localhost:8000',
//   },
// });

const dynamodb = new AWS.DynamoDB({
  region: 'us-east-2',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'FAKE',
    secretAccessKey: 'FAKE',
  },
});

(async () => {
  try {
    const result = await getItem('asdf', '1.2.3');
    // const result = await setPackage({
    //   name: 'asdf',
    //   version: '1.2.3',
    //   algo: 'none',
    //   status: Status.pending,
    // });
    console.log(result);
  } catch (err) {
    console.error(err);
  }
})();

async function createTable() {
  return new Promise(resolve => {
    const params: AWS.DynamoDB.CreateTableInput = {
      TableName: 'packages',
      KeySchema: [
        { AttributeName: 'name', KeyType: 'HASH' }, // Partition key
        { AttributeName: 'version', KeyType: 'RANGE' }, //Sort key
      ],
      AttributeDefinitions: [
        { AttributeName: 'name', AttributeType: 'S' },
        { AttributeName: 'version', AttributeType: 'S' },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };
    dynamodb.createTable(params, function(err, data) {
      if (err) {
        console.error(
          'Unable to create table. Error JSON:',
          JSON.stringify(err, null, 2),
        );
      } else {
        console.log(
          'Created table. Table description JSON:',
          JSON.stringify(data, null, 2),
        );
      }
      resolve();
    });
  });
}

async function getItem(name: string, version: string) {
  return new Promise((resolve, reject) => {
    const params: AWS.DynamoDB.GetItemInput = {
      TableName: 'packages',
      Key: {
        name: { S: name },
        version: { S: version },
      },
    };

    dynamodb.getItem(params, (err, data) => {
      if (err) reject(err);

      if (data.Item) {
        resolve({
          name: data.Item.name.S as string,
          version: data.Item.version.S as string,
          algo: data.Item.algo.S as string,
          status: data.Item.status.S as PackageVersion['status'],
        });
      } else {
        resolve(null);
      }
    });
  });
}

async function setPackage(data: PackageVersion): Promise<void> {
  const params: AWS.DynamoDB.PutItemInput = {
    TableName: 'packages',
    Item: {
      name: { S: data.name },
      version: { S: data.version },
      algo: { S: data.algo },
      status: { S: data.status },
    },
  };

  return new Promise((resolve, reject) => {
    dynamodb.putItem(params, err => (!!err ? reject(err) : resolve()));
  });
}
