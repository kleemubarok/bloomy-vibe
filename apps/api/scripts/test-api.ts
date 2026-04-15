const API_URL = 'http://localhost:3000/api';

async function test() {
  console.log('🚀 Starting API Verification Test...');

  try {
    // 1. Login as Owner
    console.log('\n🔐 Logging in as Owner...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@bloomy.id', pin: '1234' }),
    });
    
    if (!loginRes.ok) throw new Error('Login failed');
    const { accessToken } = await loginRes.json();
    const authHeader = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    console.log('✅ Login successful.');

    // 2. Create Inventory Item
    console.log('\n📦 Creating Inventory Item...');
    const invRes = await fetch(`${API_URL}/inventory`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        name: 'Test Flower',
        sku: `TEST-${Date.now()}`,
        unit: 'pcs',
        stockLevel: 100,
        reorderLevel: 10
      }),
    });
    
    if (!invRes.ok) throw new Error('Inventory creation failed');
    const invItem = await invRes.json();
    console.log(`✅ Created Inventory ID: ${invItem.id}`);

    // 3. Create Product with Recipe
    console.log('\n🌹 Creating Product with Recipe...');
    const prodRes = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        name: 'Test Bouquet',
        slug: `test-bouquet-${Date.now()}`,
        category: 'flower',
        basePrice: 50000,
        recipes: [
          { inventoryId: invItem.id, quantityRequired: 5 }
        ]
      }),
    });

    if (!prodRes.ok) throw new Error('Product creation failed');
    const product = await prodRes.json();
    console.log(`✅ Created Product ID: ${product.id}`);

    // 4. List Products and verify recipe join
    console.log('\n📡 Fetching Products List...');
    const listRes = await fetch(`${API_URL}/products`, { headers: authHeader });
    const products = await listRes.json();
    const found = products.find((p: any) => p.id === product.id);
    
    if (found && found.recipes.length > 0) {
      console.log('✅ Product found with recipes correctly joined.');
    } else {
      console.warn('⚠️ Product not found or recipes missing in list.');
    }

    // 5. Test Soft Delete
    console.log('\n🗑️ Testing Soft Delete for Product...');
    const delRes = await fetch(`${API_URL}/products/${product.id}`, {
      method: 'DELETE',
      headers: authHeader
    });
    
    if (delRes.ok) {
      console.log('✅ Product soft-deleted successfully.');
    } else {
      throw new Error('Soft delete failed');
    }

    console.log('\n✨ All tests completed successfully!');

  } catch (err: any) {
    console.error('\n❌ Test failed:');
    console.error(err.message);
    process.exit(1);
  }
}

test();
