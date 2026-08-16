import { generateRoomOgPng } from './ogRenderer.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const roomCode = url.searchParams.get('room') || url.searchParams.get('join') || url.searchParams.get('r') || '';

  try {
    const png = await generateRoomOgPng(roomCode);
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response('Error generating image: ' + err.message, { status: 500 });
  }
}
