/**
 * Database Seed Script
 *
 * This script seeds the database with:
 * 1. Lookup tables (pricing factors from Excel workbook)
 * 2. Sample users for testing
 * 3. Sample quotes for development
 *
 * Run with: npm run prisma:seed
 * or: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Import lookup data from JSON files
import lookupData from '../src/data/lookups/all-lookup-tables.json';

async function main() {
  console.log('🌱 Starting database seed...');

  // ========================================================================
  // 1. SEED LOOKUP TABLES
  // ========================================================================

  console.log('\n📊 Seeding lookup tables...');

  // Cost Basis Factors
  console.log('  → Cost Basis Factors...');
  for (const item of lookupData.cost_basis) {
    await prisma.costBasisFactor.upsert({
      where: {
        minAmount: item.purchasePrice,
      },
      update: {
        factor: item.factor,
      },
      create: {
        minAmount: item.purchasePrice,
        maxAmount: null, // Will be calculated based on next tier
        factor: item.factor,
        description: `Purchase price from $${item.purchasePrice.toLocaleString()}`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${lookupData.cost_basis.length} cost basis factors`);

  // Zip Code Factors
  console.log('  → Zip Code Factors...');
  for (const item of lookupData.zip_code) {
    await prisma.zipCodeFactor.upsert({
      where: {
        minZipCode: String(item.zipCode).padStart(5, '0'),
      },
      update: {
        factor: item.factor,
      },
      create: {
        minZipCode: String(item.zipCode).padStart(5, '0'),
        maxZipCode: null,
        factor: item.factor,
        region: getRegionFromZip(item.zipCode),
        description: `ZIP codes starting with ${String(item.zipCode).substring(0, 2)}`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${lookupData.zip_code.length} zip code factors`);

  // Square Footage Factors
  console.log('  → Square Footage Factors...');
  for (const item of lookupData.sqft) {
    const sqftValue = typeof item.squareFeet === 'string'
      ? parseInt(item.squareFeet.replace('+', ''))
      : item.squareFeet;

    await prisma.sqFtFactor.upsert({
      where: {
        minSqFt: sqftValue,
      },
      update: {
        factor: item.factor,
      },
      create: {
        minSqFt: sqftValue,
        maxSqFt: null,
        factor: item.factor,
        description: `${item.squareFeet} square feet`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${lookupData.sqft.length} square footage factors`);

  // Acres Factors
  console.log('  → Acres Factors...');
  for (const item of lookupData.acres) {
    const acresValue = typeof item.acres === 'string'
      ? parseFloat(item.acres.replace('+', ''))
      : item.acres;

    await prisma.acresFactor.upsert({
      where: {
        minAcres: acresValue,
      },
      update: {
        factor: item.factor,
      },
      create: {
        minAcres: acresValue,
        maxAcres: null,
        factor: item.factor,
        description: `${item.acres} acres of land`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${lookupData.acres.length} acres factors`);

  // Property Type Factors
  console.log('  → Property Type Factors...');
  for (const item of lookupData.property_type) {
    await prisma.propertyTypeFactor.upsert({
      where: {
        propertyType: item.propertyType,
      },
      update: {
        factor: item.factor,
      },
      create: {
        propertyType: item.propertyType,
        factor: item.factor,
        description: getPropertyTypeDescription(item.propertyType),
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${lookupData.property_type.length} property type factors`);

  // Floors Factors
  console.log('  → Floors Factors...');
  for (const item of lookupData.floors) {
    const floorsValue = typeof item.numberOfFloors === 'string'
      ? parseInt(item.numberOfFloors.replace('+', ''))
      : item.numberOfFloors;

    await prisma.floorsFactor.upsert({
      where: {
        numberOfFloors: floorsValue,
      },
      update: {
        factor: item.factor,
      },
      create: {
        numberOfFloors: floorsValue,
        factor: item.factor,
        description: `${item.numberOfFloors} floors`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${lookupData.floors.length} floors factors`);

  // Multiple Properties Factors
  console.log('  → Multiple Properties Factors...');
  for (const item of lookupData.multiple_properties) {
    const countValue = typeof item.propertyCount === 'string'
      ? parseInt(item.propertyCount.replace('+', ''))
      : item.propertyCount;

    await prisma.multiplePropertiesFactor.upsert({
      where: {
        propertyCount: countValue,
      },
      update: {
        factor: item.factor,
      },
      create: {
        propertyCount: countValue,
        factor: item.factor,
        description: `${item.propertyCount} properties (volume discount)`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${lookupData.multiple_properties.length} multiple properties factors`);

  // ========================================================================
  // 2. SEED DEPRECIATION RATES (MACRS)
  // ========================================================================

  console.log('\n📈 Seeding depreciation rates...');

  const macrsRates = [
    { year: 1, rate: 0.20, period: '5-year' },
    { year: 2, rate: 0.32, period: '5-year' },
    { year: 3, rate: 0.192, period: '5-year' },
    { year: 4, rate: 0.1152, period: '5-year' },
    { year: 5, rate: 0.1152, period: '5-year' },
    { year: 6, rate: 0.0576, period: '5-year' },
  ];

  for (const rate of macrsRates) {
    await prisma.depreciationRate.upsert({
      where: {
        year_method_depreciationPeriod: {
          year: rate.year,
          method: 'MACRS',
          depreciationPeriod: rate.period,
        },
      },
      update: {
        rate: rate.rate,
      },
      create: {
        year: rate.year,
        rate: rate.rate,
        method: 'MACRS',
        depreciationPeriod: rate.period,
        description: `MACRS ${rate.period} - Year ${rate.year}`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Seeded ${macrsRates.length} depreciation rates`);

  // ========================================================================
  // 3. SEED SYSTEM CONFIGURATION
  // ========================================================================

  console.log('\n⚙️  Seeding system configuration...');

  const systemConfigs = [
    {
      key: 'base_pricing_formula',
      value: { formula: 'purchasePrice * 0.015', description: '1.5% of purchase price' },
      dataType: 'json',
      category: 'pricing',
      description: 'Base pricing formula before applying factors',
    },
    {
      key: 'payment_option_upfront_discount',
      value: 0.95,
      dataType: 'number',
      category: 'pricing',
      description: '5% discount for paying upfront',
    },
    {
      key: 'payment_option_5050_multiplier',
      value: 1.1,
      dataType: 'number',
      category: 'pricing',
      description: '10% increase for 50/50 payment plan',
    },
    {
      key: 'payment_option_monthly_multiplier',
      value: 1.2,
      dataType: 'number',
      category: 'pricing',
      description: '20% increase for monthly payment (12 months)',
    },
    {
      key: 'calculation_version',
      value: '27.1',
      dataType: 'string',
      category: 'system',
      description: 'Current calculation logic version',
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {
        value: config.value as any,
        dataType: config.dataType,
        description: config.description,
      },
      create: config as any,
    });
  }
  console.log(`  ✓ Seeded ${systemConfigs.length} system configuration entries`);

  // ========================================================================
  // 4. SEED SAMPLE USERS
  // ========================================================================

  console.log('\n👤 Seeding sample users...');

  const sampleUsers = [
    {
      email: 'admin@openasapp.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
    {
      email: 'demo@openasapp.com',
      name: 'Demo User',
      password: await bcrypt.hash('demo123', 10),
      role: 'user',
    },
  ];

  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`  ✓ Created user: ${user.email}`);
  }

  // ========================================================================
  // 5. SEED SAMPLE QUOTES
  // ========================================================================

  console.log('\n📋 Seeding sample quotes...');

  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@openasapp.com' },
  });

  if (demoUser) {
    const sampleQuote = await prisma.quote.create({
      data: {
        userId: demoUser.id,
        productType: 'RCGV',
        status: 'draft',
        purchasePrice: 2550000,
        zipCode: '85260',
        sqFtBuilding: 1500,
        acresLand: 0.78,
        propertyType: 'Multi-Family',
        numberOfFloors: 2,
        multipleProperties: 1,
        taxYear: 2025,
        yearBuilt: 2010,
        capEx: 50000,
        propertyOwnerName: 'Acme Properties LLC',
        propertyAddress: '123 Main St, Scottsdale, AZ 85260',
        // Calculated values (these would be calculated by the quote engine)
        costBasisFactor: 1.3,
        zipCodeFactor: 1.11,
        sqFtFactor: 1.0,
        acresFactor: 0.75,
        propertyTypeFactor: 0.4,
        floorsFactor: 1.0,
        multiplePropertiesFactor: 1.0,
        bidAmountOriginal: 38250,
        landValue: 78000,
        buildingValue: 2522000,
        depreciationMethod: '27.5-year',
        depreciationYears: 27.5,
        notes: 'Sample quote for demonstration purposes',
        calculationVersion: '27.1',
      },
    });
    console.log(`  ✓ Created sample quote: ${sampleQuote.id}`);
  }

  console.log('\n✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  • ${await prisma.costBasisFactor.count()} cost basis factors`);
  console.log(`  • ${await prisma.zipCodeFactor.count()} zip code factors`);
  console.log(`  • ${await prisma.sqFtFactor.count()} square footage factors`);
  console.log(`  • ${await prisma.acresFactor.count()} acres factors`);
  console.log(`  • ${await prisma.propertyTypeFactor.count()} property type factors`);
  console.log(`  • ${await prisma.floorsFactor.count()} floors factors`);
  console.log(`  • ${await prisma.multiplePropertiesFactor.count()} multiple properties factors`);
  console.log(`  • ${await prisma.depreciationRate.count()} depreciation rates`);
  console.log(`  • ${await prisma.systemConfig.count()} system configuration entries`);
  console.log(`  • ${await prisma.user.count()} users`);
  console.log(`  • ${await prisma.quote.count()} quotes`);
}

// Helper function to get region name from zip code
function getRegionFromZip(zipCode: number): string {
  const zip = String(zipCode);
  const prefix = zip.substring(0, 2);

  const regions: Record<string, string> = {
    '00': 'Northeast (0xxxx)',
    '10': 'Northeast (1xxxx)',
    '20': 'Mid-Atlantic (2xxxx)',
    '30': 'Southeast (3xxxx)',
    '40': 'Midwest (4xxxx)',
    '50': 'Midwest (5xxxx)',
    '60': 'Midwest (6xxxx)',
    '70': 'South Central (7xxxx)',
    '80': 'Mountain (8xxxx)',
    '90': 'West Coast (9xxxx)',
    '96': 'Alaska/Hawaii (96xxx)',
    '99': 'Alaska (99xxx)',
  };

  return regions[prefix] || 'Unknown Region';
}

// Helper function to get property type description
function getPropertyTypeDescription(propertyType: string): string {
  const descriptions: Record<string, string> = {
    'Industrial': 'Manufacturing facilities, industrial parks, and production facilities',
    'Medical': 'Medical offices, clinics, and healthcare facilities',
    'Office': 'Professional office buildings and business centers',
    'Other': 'Mixed-use or special purpose commercial properties',
    'Restaurant': 'Restaurants, bars, and food service establishments',
    'Retail': 'Retail stores, shopping centers, and commercial spaces',
    'Warehouse': 'Warehouses, distribution centers, and storage facilities',
    'Multi-Family': 'Apartment buildings, multi-unit residential properties (27.5-year depreciation)',
    'Residential/LTR': 'Long-term rental residential properties',
    'Short-Term Rental': 'Short-term vacation rentals and Airbnb properties',
  };

  return descriptions[propertyType] || 'Commercial property';
}

// Execute seed function
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
