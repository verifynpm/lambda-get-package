import { ProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import * as buildInfo from './build-info.json';

export const handler: ProxyHandler = async event => {
  // TODO implement
  const response: APIGatewayProxyResult = {
    headers: { 'x-build-tag': buildInfo.tag },
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda and Travis!'),
  };
  return response;
};
