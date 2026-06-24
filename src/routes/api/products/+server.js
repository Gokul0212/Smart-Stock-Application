import { json } from '@sveltejs/kit';
import { dbGetProducts as srvGetProducts, dbAddProduct as srvAddProduct, dbUpdateProduct as srvUpdateProduct, dbDeleteProduct as srvDeleteProduct } from '$lib/firebase.js';

// GET all products
export async function GET() {
  try {
    const products = await srvGetProducts();
    return json({ success: true, products }, { status: 200 });
  } catch (error) {
    return json({ success: false, message: "Error fetching products: " + error.message }, { status: 500 });
  }
}

// POST: Add new product
export async function POST({ request }) {
  try {
    const data = await request.json();
    const { name, category, price, stock, imageUrl } = data;

    if (!name || !category || price === undefined || stock === undefined) {
      return json({ success: false, message: "Missing required product fields (name, category, price, stock)." }, { status: 400 });
    }

    const newProduct = await srvAddProduct({ name, category, price, stock, imageUrl });
    return json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    return json({ success: false, message: "Error adding product: " + error.message }, { status: 500 });
  }
}

// PUT: Update existing product
export async function PUT({ request }) {
  try {
    const data = await request.json();
    const { id, ...updatedFields } = data;

    if (!id) {
      return json({ success: false, message: "Product ID is required for update." }, { status: 400 });
    }

    const updatedProduct = await srvUpdateProduct(id, updatedFields);
    return json({ success: true, product: updatedProduct }, { status: 200 });
  } catch (error) {
    return json({ success: false, message: "Error updating product: " + error.message }, { status: 500 });
  }
}

// DELETE: Delete product
export async function DELETE({ request }) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return json({ success: false, message: "Product ID is required for deletion." }, { status: 400 });
    }

    await srvDeleteProduct(id);
    return json({ success: true, message: "Product deleted successfully." }, { status: 200 });
  } catch (error) {
    return json({ success: false, message: "Error deleting product: " + error.message }, { status: 500 });
  }
}
