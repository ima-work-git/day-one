import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

/**
 * WebSocket Message Lambda Handler (AI Pipeline: STT → LLM → TTS)
 * Unit 2 で実際の実装に置き換える
 * 
 * 実装予定:
 * 1. ユーザー音声チャンクを受信
 * 2. Amazon Transcribe で STT（音声→テキスト）
 * 3. Amazon Bedrock Nova 2 Lite で LLM 応答生成
 * 4. ElevenLabs Flash v2.5 で TTS（クローンボイス音声合成）
 * 5. 音声チャンクをクライアントへストリーミング返送
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  console.log('WsMessage event:', JSON.stringify(event, null, 2));
  const connectionId = event.requestContext.connectionId;
  console.log(`WebSocket message from: ${connectionId}`);
  return { statusCode: 200, body: 'WsMessageHandler stub - implement in Unit 2' };
};
