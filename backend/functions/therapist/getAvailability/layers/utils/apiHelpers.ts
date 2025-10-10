import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface ApiResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
  };
  body: string;
}

export const createResponse = (
  statusCode: number,
  body: any,
  headers: Record<string, string> = {}
): ApiResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers
  },
  body: JSON.stringify(body)
});

export const createErrorResponse = (statusCode: number, message: string): ApiResponse => 
  createResponse(statusCode, { error: message });

export const parseBody = (event: APIGatewayProxyEvent): any => {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

export const getPathParameter = (event: APIGatewayProxyEvent, param: string): string | undefined => {
  return event.pathParameters?.[param];
};

export const getQueryParameter = (event: APIGatewayProxyEvent, param: string): string | undefined => {
  return event.queryStringParameters?.[param];
};

export const handleCors = (event: APIGatewayProxyEvent): ApiResponse | null => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }
  return null;
};
