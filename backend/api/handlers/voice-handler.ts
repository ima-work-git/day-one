import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Voice Cloning Lambda Handler
 * Unit 2 で実際の実装に置き換える（ElevenLabs Voice Cloning API 連携）
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('VoiceHandler event:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'VoiceHandler stub - implement in Unit 2' }),
  };
};
