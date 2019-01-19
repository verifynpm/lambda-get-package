import { ProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

import * as buildInfo from './build-info.json';
import {
  createError,
  ErrorCode,
  PackageVersion,
  Status,
  JsonApiError,
} from './types.js';

export const handler: ProxyHandler = async event => {
  try {
    const { name, version } = parsePackageParam(
      event.pathParameters.packageVersion,
    );

    const {
      name: metaName,
      version: metaVersion,
      repo,
      gitHead,
      shasum,
    } = await getHashes(name, version);

    let result: PackageVersion | { errors: JsonApiError[] } = null;

    if (!metaName) {
      result = {
        errors: [
          createError(ErrorCode.NOT_FOUND, `Package ${name} does not exist`),
        ],
      };
    } else if (!metaVersion) {
      result = {
        errors: [
          createError(
            ErrorCode.NOT_FOUND,
            `Package version ${name}@${version} does not exist`,
          ),
        ],
      };
    } else {
      result = {
        name,
        version,
        algo: 'none',
        status: Status.unknown,
      };
    }

    const response: APIGatewayProxyResult = {
      headers: { 'x-build-tag': buildInfo.tag },
      statusCode: 200,
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

function parsePackageParam(
  packageVersion: string,
): { name: string; version: string } {
  const [name, version] = packageVersion.split('@');

  return {
    name,
    version: version || 'latest',
  };
}

async function getHashes(
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
      await axios.get(`https://registry.npmjs.com/${name}`);
    } catch {
      return {
        name: undefined,
        version: undefined,
        repo: undefined,
        gitHead: undefined,
        shasum: undefined,
      };
    }

    const v =
      version || (res.data['dist-tags'] && res.data['dist-tags'].latest);

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
