// app/api/consent/route.js (for Next.js App Router)

import { NextResponse } from 'next/server';

/**
 * Handle POST request to set cookie consent
 */
export async function POST(request) {
  try {
    const { accepted } = await request.json(); // Expects { accepted: boolean }
    
    // Determine the value to store
    const consentValue = accepted ? 'accepted' : 'rejected';

    // 💡 Setting the cookie via the Response Headers
    // The "Set-Cookie" header is used to send a cookie from the server to the client.
    
    const response = new NextResponse(
      JSON.stringify({ status: 'success', consent: consentValue }),
      { 
        status: 200, 
        headers: {
          'Content-Type': 'application/json',
          // Set the cookie
          'Set-Cookie': `server_side_consent=${consentValue}; Path=/; Max-Age=${365 * 24 * 60 * 60}; ${accepted ? 'Secure; HttpOnly;' : 'Secure;'}`
          // Max-Age sets the cookie to expire in 365 days (in seconds)
          // HttpOnly: prevents client-side JavaScript access (good for security/session cookies)
          // Secure: only send the cookie over HTTPS
        }
      }
    );

    // Optional: Log the consent choice
    console.log(`User consent logged: ${consentValue}`);

    return response;
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ status: 'error', message: 'Invalid request body' }),
      { status: 400 }
    );
  }
}