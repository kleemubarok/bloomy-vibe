import { db } from './local';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Clean existing data (optional, but good for reproducibility)
  // We do it in reverse order of dependencies
  await db.delete(schema.syncQueue);
  await db.delete(schema.inventoryLog);
  await db.delete(schema.payments);
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.productRecipes);
  await db.delete(schema.products);
  await db.delete(schema.inventory);
  await db.delete(schema.users);

  console.log('✅ Database cleared.');

  // 2. Seed Users
  const insertedUsers = await db.insert(schema.users).values([
    {
      name: 'Super Admin',
      email: 'super@bloomy.id',
      role: 'superadmin',
      pin: '1234',
    },
    {
      name: 'Bang Kleem',
      email: 'owner@bloomy.id',
      role: 'owner',
      pin: '1234',
    },
    {
      name: 'Staf Kece',
      email: 'staf@bloomy.id',
      role: 'staff',
      pin: '1234',
    },
  ]).returning();
  console.log(`👤 Inserted ${insertedUsers.length} users.`);

  // 3. Seed Inventory (Materials)
  // Stock random 10-50 per feedback
  const getRandomStock = () => Math.floor(Math.random() * 41) + 10;

  const insertedInventory = await db.insert(schema.inventory).values([
    { name: 'Mawar Merah', sku: 'INV-ROSE-RED', unit: 'tangkai', stockLevel: getRandomStock(), reorderLevel: 10 },
    { name: 'Mawar Putih', sku: 'INV-ROSE-WHT', unit: 'tangkai', stockLevel: getRandomStock(), reorderLevel: 10 },
    { name: 'Kertas Wrapping Pink', sku: 'INV-WRAP-PNK', unit: 'lembar', stockLevel: getRandomStock(), reorderLevel: 5 },
    { name: 'Pita Satin Rose Gold', sku: 'INV-PITA-RG', unit: 'meter', stockLevel: getRandomStock(), reorderLevel: 5 },
  ]).returning();
  console.log(`📦 Inserted ${insertedInventory.length} inventory items.`);

  // 4. Seed Products
  const insertedProducts = await db.insert(schema.products).values([
    {
      name: 'Single Red Rose',
      slug: 'single-red-rose',
      category: 'flower',
      basePrice: 25000,
      imageUrl: '/images/products/single-red-rose.png',
    },
    {
      name: 'Red Passion Bouquet (10 Roses)',
      slug: 'red-passion-10',
      category: 'flower',
      basePrice: 350000,
      imageUrl: '/images/products/red-passion-10.png',
    },
    {
      name: 'White Serenity Bouquet',
      slug: 'white-serenity',
      category: 'flower',
      basePrice: 450000,
      imageUrl: '/images/products/white-serenity.png',
    },
  ]).returning();
  console.log(`🌹 Inserted ${insertedProducts.length} products.`);

  // 5. Seed Recipes
  const mawarMerah = insertedInventory.find(i => i.sku === 'INV-ROSE-RED')!;
  const mawarPutih = insertedInventory.find(i => i.sku === 'INV-ROSE-WHT')!;
  const wrappingPink = insertedInventory.find(i => i.sku === 'INV-WRAP-PNK')!;
  const pitaRG = insertedInventory.find(i => i.sku === 'INV-PITA-RG')!;

  const singleRose = insertedProducts.find(p => p.slug === 'single-red-rose')!;
  const passionBouquet = insertedProducts.find(p => p.slug === 'red-passion-10')!;
  const whiteBouquet = insertedProducts.find(p => p.slug === 'white-serenity')!;

  await db.insert(schema.productRecipes).values([
    // Single Rose recipe
    { productId: singleRose.id, inventoryId: mawarMerah.id, quantityRequired: 1 },
    { productId: singleRose.id, inventoryId: wrappingPink.id, quantityRequired: 0.5 },
    { productId: singleRose.id, inventoryId: pitaRG.id, quantityRequired: 0.2 },
    // Passion Bouquet recipe
    { productId: passionBouquet.id, inventoryId: mawarMerah.id, quantityRequired: 10 },
    { productId: passionBouquet.id, inventoryId: wrappingPink.id, quantityRequired: 2 },
    { productId: passionBouquet.id, inventoryId: pitaRG.id, quantityRequired: 1 },
    // White Serenity recipe
    { productId: whiteBouquet.id, inventoryId: mawarPutih.id, quantityRequired: 10 },
    { productId: whiteBouquet.id, inventoryId: wrappingPink.id, quantityRequired: 2 },
    { productId: whiteBouquet.id, inventoryId: pitaRG.id, quantityRequired: 1 },
  ]);
  console.log('📜 Inserted product recipes.');

  // --- VALIDATION JOIN ---
  console.log('\n🔍 Validating relations (Products -> Recipes -> Inventory):');

  const validation = await db.select({
    product: schema.products.name,
    material: schema.inventory.name,
    qty: schema.productRecipes.quantityRequired,
    unit: schema.inventory.unit,
    currStock: schema.inventory.stockLevel
  })
    .from(schema.products)
    .leftJoin(schema.productRecipes, eq(schema.products.id, schema.productRecipes.productId))
    .leftJoin(schema.inventory, eq(schema.productRecipes.inventoryId, schema.inventory.id));

  console.table(validation);

  console.log('\n✨ Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:');
  console.error(err);
  process.exit(1);
});
