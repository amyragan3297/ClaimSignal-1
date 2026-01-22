import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Connecting to Stripe...');
  const stripe = await getUncachableStripeClient();
  
  console.log('Checking for existing products...');
  const existingProducts = await stripe.products.list({ limit: 100 });
  const existingNames = existingProducts.data.map(p => p.name);

  const productsToCreate = [
    {
      name: 'ClaimSignal Pro',
      description: 'Full access to ClaimSignal with all premium features',
      metadata: { tier: 'pro', features: 'all' },
      prices: [
        { unit_amount: 4900, currency: 'usd', interval: 'month' as const, nickname: 'Monthly' },
        { unit_amount: 49900, currency: 'usd', interval: 'year' as const, nickname: 'Yearly (Save 15%)' },
      ]
    },
    {
      name: 'ClaimSignal Enterprise',
      description: 'Enterprise-grade features with priority support and advanced analytics',
      metadata: { tier: 'enterprise', features: 'all,priority_support,advanced_analytics' },
      prices: [
        { unit_amount: 19900, currency: 'usd', interval: 'month' as const, nickname: 'Monthly' },
        { unit_amount: 199900, currency: 'usd', interval: 'year' as const, nickname: 'Yearly (Save 16%)' },
      ]
    }
  ];

  const oneTimeProducts = [
    {
      name: 'Expert Claim Review',
      description: 'One-time expert review of a complex claim with strategic recommendations',
      metadata: { type: 'one_time', category: 'service' },
      price: { unit_amount: 29900, currency: 'usd' }
    },
    {
      name: 'Carrier Intelligence Report',
      description: 'Comprehensive analysis report for a specific insurance carrier',
      metadata: { type: 'one_time', category: 'report' },
      price: { unit_amount: 9900, currency: 'usd' }
    },
    {
      name: 'Training Session',
      description: '1-hour personalized training session on ClaimSignal features',
      metadata: { type: 'one_time', category: 'training' },
      price: { unit_amount: 14900, currency: 'usd' }
    }
  ];

  for (const productData of productsToCreate) {
    if (existingNames.includes(productData.name)) {
      console.log(`Skipping "${productData.name}" - already exists`);
      continue;
    }

    console.log(`Creating product: ${productData.name}`);
    const product = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      metadata: productData.metadata,
    });
    console.log(`  Created product: ${product.id}`);

    for (const priceData of productData.prices) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.unit_amount,
        currency: priceData.currency,
        recurring: { interval: priceData.interval },
        nickname: priceData.nickname,
      });
      console.log(`  Created price: ${price.id} (${priceData.nickname})`);
    }
  }

  for (const productData of oneTimeProducts) {
    if (existingNames.includes(productData.name)) {
      console.log(`Skipping "${productData.name}" - already exists`);
      continue;
    }

    console.log(`Creating one-time product: ${productData.name}`);
    const product = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      metadata: productData.metadata,
    });
    console.log(`  Created product: ${product.id}`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: productData.price.unit_amount,
      currency: productData.price.currency,
    });
    console.log(`  Created price: ${price.id}`);
  }

  console.log('\nProduct seeding complete!');
  console.log('Stripe webhooks will automatically sync products to the database.');
  process.exit(0);
}

seedProducts().catch(err => {
  console.error('Error seeding products:', err);
  process.exit(1);
});
