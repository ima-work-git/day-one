import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

/**
 * WebSocket Disconnect Lambda Handler
 * Unit 2 で実際の実装に置き換える
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  console.log('WsDisconnect event:', JSON.stringify(event, null, 2));
  const connectionId = event.requestContext.connectionId;
  console.log(`WebSocket disconnected: ${connectionId}`);
  return { statusCode: 200, body: 'Disconnected' };
};
