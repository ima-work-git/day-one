import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Conversation Session Lambda Handler
 * Unit 2 で実際の実装に置き換える（対話セッション管理）
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('ConversationHandler event:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'ConversationHandler stub - implement in Unit 2' }),
  };
};
