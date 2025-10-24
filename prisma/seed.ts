import { PrismaClient, Parish, UserRole, SubscriptionPlan, PortfolioItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      googleId: 'google_admin_123',
    },
  });

  // Create locations
  const kingstonLocation = await prisma.location.create({
    data: {
      name: 'Downtown Kingston',
      address: '123 King Street, Kingston',
      city: 'Kingston',
      parish: Parish.KINGSTON,
      country: 'Jamaica',
      latitude: 18.0179,
      longitude: -76.8099,
    },
  });

  const montegoBayLocation = await prisma.location.create({
    data: {
      name: 'Hip Strip Montego Bay',
      address: '456 Gloucester Avenue, Montego Bay',
      city: 'Montego Bay',
      parish: Parish.ST_JAMES,
      country: 'Jamaica',
      latitude: 18.4762,
      longitude: -77.8919,
    },
  });

  // Create provider users
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      firstName: 'John',
      lastName: 'Barber',
      role: UserRole.PROVIDER,
      isEmailVerified: true,
      googleId: 'google_owner_123',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      firstName: 'Mary',
      lastName: 'Stylist',
      role: UserRole.PROVIDER,
      isEmailVerified: true,
      appleId: 'apple_staff_123',
    },
  });

  // Create provider
  const provider = await prisma.provider.create({
    data: {
      businessName: 'John\'s Premium Barbershop',
      slug: 'johns-premium-barbershop',
      description: 'Premium barbershop services across Jamaica',
      businessPhone: '+1876-555-0123',
      businessEmail: 'info@johnsbarbershop.com',
      whatsapp: '+1876-555-0123',
      isVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
    },
  });

  // Add users to provider
  await prisma.providerUser.create({
    data: {
      providerId: provider.id,
      userId: ownerUser.id,
      title: 'Owner & Master Barber',
      isOwner: true,
      canManageBookings: true,
      canManageServices: true,
      canManageLocations: true,
      canViewAnalytics: true,
      bio: 'Master barber with 15 years of experience',
      expertise: ['Classic Cuts', 'Beard Styling', 'Hot Towel Shaves'],
    },
  });

  await prisma.providerUser.create({
    data: {
      providerId: provider.id,
      userId: staffUser.id,
      title: 'Senior Hair Stylist',
      isOwner: false,
      canManageBookings: true,
      bio: 'Specialist in modern cuts and styling',
      expertise: ['Modern Cuts', 'Hair Coloring', 'Women\'s Styling'],
    },
  });

  // Add locations to provider
  await prisma.providerLocation.create({
    data: {
      providerId: provider.id,
      locationId: kingstonLocation.id,
      isPrimary: true,
    },
  });

  await prisma.providerLocation.create({
    data: {
      providerId: provider.id,
      locationId: montegoBayLocation.id,
      isPrimary: false,
    },
  });

  // Create services
  await prisma.service.createMany({
    data: [
      {
        providerId: provider.id,
        name: 'Classic Haircut',
        description: 'Traditional barbershop haircut with wash and style',
        category: 'Hair',
        subCategory: 'Cuts',
        basePrice: 1500, // JMD $15.00
        duration: 45,
      },
      {
        providerId: provider.id,
        name: 'Beard Trim & Style',
        description: 'Professional beard trimming and styling',
        category: 'Hair',
        subCategory: 'Beard',
        basePrice: 800, // JMD $8.00
        duration: 30,
      },
      {
        providerId: provider.id,
        name: 'Hot Towel Shave',
        description: 'Luxury hot towel shave experience',
        category: 'Hair',
        subCategory: 'Shave',
        basePrice: 2000, // JMD $20.00
        duration: 60,
      },
    ],
  });

  // Create portfolio items
  await prisma.portfolioItem.createMany({
    data: [
      {
        providerId: provider.id,
        title: 'Classic Fade Transformation',
        description: 'Before and after of a classic fade cut',
        type: PortfolioItemType.PHOTO,
        imageUrl: 'https://example.com/portfolio/fade-before-after.jpg',
        category: 'Before/After',
        tags: ['fade', 'classic', 'transformation'],
        isFeatured: true,
      },
      {
        providerId: provider.id,
        title: 'Barbering Technique Tutorial',
        description: 'Step-by-step beard trimming technique',
        type: PortfolioItemType.VIDEO_YOUTUBE,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        category: 'Tutorials',
        tags: ['beard', 'tutorial', 'technique'],
        isFeatured: true,
      },
      {
        providerId: provider.id,
        title: 'Shop Tour and Services',
        description: 'Virtual tour of our premium facilities',
        type: PortfolioItemType.VIDEO_VIMEO,
        videoUrl: 'https://vimeo.com/123456789',
        videoId: '123456789',
        category: 'Shop Tour',
        tags: ['tour', 'facilities', 'services'],
      },
    ],
  });

  // Create availability
  const daysOfWeek = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
  for (const day of daysOfWeek) {
    // General provider availability
    await prisma.availability.create({
      data: {
        providerId: provider.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      },
    });

    // Owner availability
    await prisma.availability.create({
      data: {
        providerId: provider.id,
        providerUserId: ownerUser.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    });

    // Staff availability (different hours)
    await prisma.availability.create({
      data: {
        providerId: provider.id,
        providerUserId: staffUser.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '18:00',
        isActive: true,
      },
    });
  }

  console.log('Database seeded successfully with multi-location, multi-user provider setup');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
