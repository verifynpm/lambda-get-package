import { ProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import * as axios from 'axios';

import * as buildInfo from './build-info.json';
import { createError, ErrorCode, PackageVersion, Status } from './types.js';

export const handler: ProxyHandler = async event => {
  // TODO implement
  try {
    const { name, version } = parsePackageParam(
      event.pathParameters.packageVersion,
    );

    const result: PackageVersion = {
      name,
      version,
      algo: 'none',
      status: Status.unknown,
    };

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
