import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET a single product by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// UPDATE a product by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { name, description, quantity } = await request.json();

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        quantity: quantity ? parseInt(quantity, 10) : undefined,
      },
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE a product by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    await prisma.product.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 }); // No content for successful deletion
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
