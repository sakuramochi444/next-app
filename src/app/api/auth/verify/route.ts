import { NextResponse, NextRequest } from 'next/server';

// Helper to check admin password
const isAdmin = (password: string) => {
  const envPassword = process.env.ADMIN_PASSWORD;
  console.log('DEBUG: Checking password. env exists:', !!envPassword, 'input length:', password.length);
  return password === envPassword;
};

// POST to verify admin password
export async function POST(request: NextRequest) {
  console.log('API: /api/auth/verify POST request received.');
  console.log('DEBUG: ADMIN_PASSWORD env var exists:', !!process.env.ADMIN_PASSWORD);
  
  try {
    const { password } = await request.json();

    if (!password) {
      console.error('API Error: Missing password field');
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const authenticated = isAdmin(password);
    
    if (!authenticated) {
      console.log('API: Authentication failed - invalid password');
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    console.log('API: Authentication successful');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('API Error: Error verifying password:', message);
    return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 });
  }
}
