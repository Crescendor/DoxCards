// Cloudflare Pages Middleware for dynamic OpenGraph Discord Embeds
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Extract room code from query params (?room=abc12, ?join=abc12, ?r=abc12) or path (/join/abc12, /room/abc12)
  let roomCode = url.searchParams.get('room') || url.searchParams.get('join') || url.searchParams.get('r');
  if (!roomCode) {
    const pathMatch = url.pathname.match(/^\/(?:room|join)\/([a-zA-Z0-9]{3,8})/i);
    if (pathMatch) {
      roomCode = pathMatch[1];
    }
  }

  // If path is /join/abc12 or /room/abc12, rewrite to root / while keeping query params for SPA router
  if (url.pathname.startsWith('/join/') || url.pathname.startsWith('/room/')) {
    const code = roomCode || url.pathname.split('/')[2];
    url.pathname = '/';
    if (code) {
      url.searchParams.set('room', code.toLowerCase().trim());
    }
  }

  const response = await next();

  // If not HTML response, return as-is
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const cleanRoomCode = roomCode ? roomCode.toUpperCase().trim() : null;

  const title = 'Doxcards - Dostluk bitiren çöpçatanlık oyunu';

  const description = cleanRoomCode
    ? `Arkadaşlarınla 5 haneli lobi oluştur, en absürt randevuları kur ve rakiplerini kırmızı bayraklarla sabote et!\nLobi kodu: ${cleanRoomCode}`
    : 'Arkadaşlarınla 5 haneli lobi oluştur, en absürt randevuları kur ve rakiplerini kırmızı bayraklarla sabote et!';

  const fullUrl = cleanRoomCode
    ? `${url.origin}/?room=${cleanRoomCode.toLowerCase()}`
    : `${url.origin}/`;

  const imageUrl = cleanRoomCode
    ? `https://doxcards-server.burakcnaydin.workers.dev/api/og?room=${cleanRoomCode}`
    : `${url.origin}/embed_banner.png`;

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(title);
      }
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute('content', description);
      }
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute('content', title);
      }
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute('content', description);
      }
    })
    .on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute('content', fullUrl);
      }
    })
    .on('meta[property="og:image"]', {
      element(element) {
        element.setAttribute('content', imageUrl);
      }
    })
    .on('meta[name="twitter:title"]', {
      element(element) {
        element.setAttribute('content', title);
      }
    })
    .on('meta[name="twitter:description"]', {
      element(element) {
        element.setAttribute('content', description);
      }
    })
    .on('meta[name="twitter:image"]', {
      element(element) {
        element.setAttribute('content', imageUrl);
      }
    })
    .on('meta[name="theme-color"]', {
      element(element) {
        element.setAttribute('content', '#FF0000');
      }
    });

  return rewriter.transform(response);
}
