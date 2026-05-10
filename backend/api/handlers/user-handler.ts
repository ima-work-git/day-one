import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * User Management Lambda Handler
 * Unit 3 で実際の実装に置き換える
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('UserHandler event:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'UserHandler stub - implement in Unit 3' }),
  };
};
