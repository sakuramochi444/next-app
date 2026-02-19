import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all products
export async function GET() {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST a new product
export async function POST(request: Request) {
  try {
    const { name, description, quantity } = await request.json();

    if (!name || !quantity) {
      return NextResponse.json({ error: 'Missing required fields: name, quantity' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        quantity: parseInt(quantity, 10), // Ensure quantity is an int
      },
    });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
