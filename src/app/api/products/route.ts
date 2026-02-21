import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// GET all products
export async function GET() {
  console.log('API: /api/products GET request received.');
  try {
    const products = await prisma.product.findMany();
    console.log('API: Fetched products:', products);
    return NextResponse.json(products);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('API Error: Error fetching products:', message);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST a new product
export async function POST(request: NextRequest) {
  console.log('API: /api/products POST request received.');
  try {
    const { name, description, quantity, requiredQuantity } = await request.json();

    if (!name || quantity == null) {
      console.error('API Error: Missing required fields for POST product:', { name, quantity });
      return NextResponse.json({ error: 'Missing required fields: name, quantity' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        quantity: parseInt(quantity, 10),
        requiredQuantity: requiredQuantity ? parseInt(requiredQuantity, 10) : 0,
      },
    });
    console.log('API: Created new product:', newProduct);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('API Error: Error creating product:', message);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
