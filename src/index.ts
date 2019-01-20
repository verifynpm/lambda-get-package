import { ProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import * as semver from 'semver';
import * as AWS from 'aws-sdk';

import * as buildInfo from './build-info.json';
import {
  createError,
  ErrorCode,
  PackageVersion,
  Status,
  JsonApiError,
} from './types';

export const handler: ProxyHandler = async event => {
  try {
    const { name, version } = parsePackageParam(
      event.pathParameters.packageVersion,
    );

    try {
      const x = await getPackage(name, version);
      return {
        statusCode: 200,
        headers: { 'x-build-tag': buildInfo.tag },
        body: JSON.stringify(x),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'x-build-tag': buildInfo.tag },
        body: JSON.stringify({
          errors: createError(ErrorCode.INTERNAL_ERROR, `It's really bad`),
        }),
      };
    }

    const {
      name: metaName,
      version: metaVersion,
      repo,
      gitHead,
      shasum,
    } = await getHashes(name, version);

    let result: PackageVersion | { errors: JsonApiError[] } = null;
    let statusCode = 200;

    if (!metaName) {
      result = {
        errors: [
          createError(ErrorCode.NOT_FOUND, `Package ${name} does not exist`),
        ],
      };
      statusCode = 404;
    } else if (!metaVersion) {
      result = {
        errors: [
          createError(
            ErrorCode.NOT_FOUND,
            `Package version ${name}@${version} does not exist`,
          ),
        ],
      };
      statusCode = 404;
    } else {
      result = {
        name,
        version: metaVersion,
        algo: 'none',
        status: Status.unknown,
      };
    }

    const response: APIGatewayProxyResult = {
      headers: { 'x-build-tag': buildInfo.tag },
      statusCode,
      body: JSON.stringify(result),
    };
    return response;
  } catch (err) {
    return <APIGatewayProxyResult>{
      headers: { 'x-build-tag': buildInfo.tag },
      statusCode: 500,
      body: JSON.stringify(createError(ErrorCode.INTERNAL_ERROR, err.message)),
    };
  }
};

async function getPackage(
  name: string,
  version: string,
): Promise<PackageVersion> {
  return new Promise((resolve, reject) => {
    try {
      const ddb = new AWS.DynamoDB({
        region: 'us-east-2',
        apiVersion: '2012-10-18',
      });
      const params: AWS.DynamoDB.GetItemInput = {
        TableName: 'packages',
        Key: {
          name: { S: name },
          version: { S: version },
        },
      };

      ddb.getItem(params, (err, data) => {
        try {
          if (err) reject(err);

          if (data.Item) {
            resolve({
              name: data.Item.name.S as string,
              version: data.Item.version.S as string,
              algo: data.Item.algo.S as string,
              status: data.Item.status.S as Status,
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// async function setPackage(data: PackageVersion): Promise<void> {
//   const ddb = new DynamoDB({ region: 'us-east-2', apiVersion: '2012-10-18' });

//   const params: DynamoDB.PutItemInput = {
//     TableName: 'packages',
//     Item: {
//       name: { S: data.name },
//       version: { S: data.version },
//       algo: { S: data.algo },
//       status: { S: data.status },
//     },
//   };

//   return new Promise((resolve, reject) => {
//     ddb.putItem(params, err => (!!err ? reject(err) : resolve()));
//   });
// }

function parsePackageParam(
  packageVersion: string,
): { name: string; version: string } {
  const [name, version] = packageVersion.split('@');

  return {
    name,
    version: version || 'latest',
  };
}

export async function getHashes(
  name: string,
  version: string,
): Promise<{
  name: string;
  version: string;
  repo: string;
  gitHead: string;
  shasum: string;
}> {
  try {
    let res: any;
    try {
      res = await axios.get(`https://registry.npmjs.com/${name}`);
    } catch {
      return {
        name: undefined,
        version: undefined,
        repo: undefined,
        gitHead: undefined,
        shasum: undefined,
      };
    }

    const vv =
      (res.data['dist-tags'] && res.data['dist-tags'][version]) || version;

    const v = semver.maxSatisfying(Object.keys(res.data.versions), vv);

    const meta = res.data.versions && res.data.versions[v];

    if (!meta) {
      return {
        name,
        version: undefined,
        repo: undefined,
        gitHead: undefined,
        shasum: undefined,
      };
    }

    const repostr =
      meta &&
      meta.repository &&
      meta.repository.type === 'git' &&
      meta.repository.url;

    const gitHead = meta && meta.gitHead;

    const shasum = meta && meta.dist && meta.dist.shasum;

    return {
      name,
      version: meta ? v : undefined,
      repo: repostr.substring(4),
      gitHead,
      shasum,
    };
  } catch {
    return {
      name,
      version,
      repo: undefined,
      gitHead: undefined,
      shasum: undefined,
    };
  }
}
