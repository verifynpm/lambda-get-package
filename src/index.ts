import { ProxyHandler } from 'aws-lambda';

export const handler: ProxyHandler = async event => {
  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};
