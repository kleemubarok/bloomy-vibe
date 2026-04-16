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

  // 6. Seed Dummy Orders for Dashboard Testing
  const now = new Date();
  const hour = 1000 * 60 * 60;

  const insertedOrders = await db.insert(schema.orders).values([
    // Antri orders
    {
      customerName: 'Sarah Wijaya',
      customerWhatsapp: '081234567890',
      totalAmount: 350000,
      discountAmount: 0,
      status: 'Antri',
      paymentStatus: 'Pending',
      orderType: 'POS',
      deliveryDate: new Date(now.getTime() + 2 * hour),
      createdAt: new Date(now.getTime() - 30 * 60000), // 30 mins ago
      updatedAt: new Date(now.getTime() - 30 * 60000),
    },
    {
      customerName: 'Budi Santoso',
      customerWhatsapp: '089876543210',
      totalAmount: 25000,
      discountAmount: 0,
      status: 'Antri',
      paymentStatus: 'Paid',
      orderType: 'Self-Order',
      messageCard: 'Happy Birthday! Wish you all the best.',
      senderName: 'From Mom',
      deliveryDate: new Date(now.getTime() + 24 * hour),
      createdAt: new Date(now.getTime() - 1 * hour), // 1 hour ago
      updatedAt: new Date(now.getTime() - 1 * hour),
    },
    // Dirangkai orders
    {
      customerName: 'Ani Purnama',
      customerWhatsapp: '085678901234',
      totalAmount: 450000,
      discountAmount: 25000,
      status: 'Dirangkai',
      paymentStatus: 'Paid',
      orderType: 'POS',
      deliveryDate: new Date(now.getTime() + 1 * hour),
      createdAt: new Date(now.getTime() - 2 * hour),
      updatedAt: new Date(now.getTime() - 15 * 60000),
    },
    // Selesai orders
    {
      customerName: 'Dewi Lestari',
      customerWhatsapp: '081298765432',
      totalAmount: 700000,
      discountAmount: 0,
      status: 'Selesai',
      paymentStatus: 'Paid',
      orderType: 'POS',
      deliveryDate: new Date(now.getTime() - 2 * hour),
      createdAt: new Date(now.getTime() - 5 * hour),
      updatedAt: new Date(now.getTime() - 30 * 60000),
    },
    {
      customerName: 'Rudi Hermawan',
      customerWhatsapp: '087712345678',
      totalAmount: 325000,
      discountAmount: 0,
      status: 'Selesai',
      paymentStatus: 'Partial',
      orderType: 'Self-Order',
      messageCard: 'Selamat ulang tahun! Semoga sehat selalu.',
      senderName: 'Best Friend',
      deliveryDate: new Date(now.getTime() - 4 * hour),
      createdAt: new Date(now.getTime() - 8 * hour),
      updatedAt: new Date(now.getTime() - 1 * hour),
    },
  ]).returning();
  console.log(`📋 Inserted ${insertedOrders.length} dummy orders.`);

  // 7. Seed Order Items
  const order1 = insertedOrders[0];
  const order2 = insertedOrders[1];
  const order3 = insertedOrders[2];
  const order4 = insertedOrders[3];
  const order5 = insertedOrders[4];

  await db.insert(schema.orderItems).values([
    // Order 1 - Antri (Bouquet)
    { orderId: order1.id, productId: passionBouquet.id, quantity: 1, unitPriceAtOrder: 350000 },
    // Order 2 - Antri (Single Rose)
    { orderId: order2.id, productId: singleRose.id, quantity: 1, unitPriceAtOrder: 25000 },
    // Order 3 - Dirangkai (White Bouquet)
    { orderId: order3.id, productId: whiteBouquet.id, quantity: 1, unitPriceAtOrder: 450000 },
    // Order 4 - Selesai (2 Bouquets)
    { orderId: order4.id, productId: passionBouquet.id, quantity: 2, unitPriceAtOrder: 350000 },
    // Order 5 - Selesai (Mixed)
    { orderId: order5.id, productId: whiteBouquet.id, quantity: 1, unitPriceAtOrder: 450000 },
    { orderId: order5.id, productId: singleRose.id, quantity: 3, unitPriceAtOrder: 25000 },
  ]);
  console.log('📦 Inserted order items.');

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
