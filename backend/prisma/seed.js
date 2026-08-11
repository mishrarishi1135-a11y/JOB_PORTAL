const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with mock companies and jobs...');

  // 1. Create a mock recruiter user
  const recruiter = await prisma.user.upsert({
    where: { clerkId: 'mock_user_recruiter' },
    update: {},
    create: {
      clerkId: 'mock_user_recruiter',
      email: 'recruiter@example.com',
      name: 'Jane Recruiter',
      role: 'recruiter',
      bio: 'HR Manager at TechCorp',
      contactNumber: '123-456-7890',
      skills: ['Recruiting', 'Management', 'Talent Acquisition']
    }
  });

  // 2. Create mock companies
  const company1 = await prisma.company.upsert({
    where: { name: 'TechCorp Solutions' },
    update: {},
    create: {
      name: 'TechCorp Solutions',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      website: 'https://techcorp.example.com',
      description: 'A leading provider of enterprise technology solutions and cloud integration services worldwide.',
      location: 'San Francisco, CA',
      createdBy: 'mock_user_recruiter'
    }
  });

  const company2 = await prisma.company.upsert({
    where: { name: 'DesignHub Creative' },
    update: {},
    create: {
      name: 'DesignHub Creative',
      logoUrl: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=100&h=100&fit=crop',
      website: 'https://designhub.example.com',
      description: 'Award-winning digital design agency specializing in brand identity, custom website interfaces, and modern mobile app user experiences.',
      location: 'New York, NY',
      createdBy: 'mock_user_recruiter'
    }
  });

  // 3. Create mock jobs
  // Use create to check if they already exist, or skipDuplicates
  const jobsData = [
    {
      title: 'Senior Frontend Engineer (React)',
      description: 'We are looking for a Senior React Developer to join our core product team. You will lead the development of modern user interfaces and build scalable web applications using React, Vite, and tailwind.',
      requirements: ['5+ years of software engineering experience', 'Strong proficiency in React, TypeScript, and modern CSS systems', 'Experience with state management libraries like Redux or Zustand'],
      skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'Redux'],
      location: 'San Francisco, CA',
      salaryRange: '$120,000 - $150,000',
      jobType: 'Full-time',
      companyId: company1.id,
      recruiterId: 'mock_user_recruiter',
      views: 45
    },
    {
      title: 'Backend Software Engineer (Node.js)',
      description: 'Join us to build high-performance APIs and microservices. You will work closely with database systems, Prisma ORM, and cloud infrastructure to ensure backend reliability.',
      requirements: ['3+ years building production APIs in Node.js', 'Experience with PostgreSQL or MongoDB', 'Understanding of RESTful services, CORS, and Express framework'],
      skills: ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'API Design'],
      location: 'Remote',
      salaryRange: '$90,000 - $110,000',
      jobType: 'Remote',
      companyId: company1.id,
      recruiterId: 'mock_user_recruiter',
      views: 28
    },
    {
      title: 'Lead UI/UX Designer',
      description: 'DesignHub is looking for a Lead UI/UX Designer to craft beautiful interfaces and user journeys for international clients across mobile and web platforms.',
      requirements: ['Strong portfolio demonstrating high-quality UI design work', 'Proficiency with Figma, Sketch, or Adobe XD', 'Excellent communication skills and experience leading teams'],
      skills: ['UI Design', 'Figma', 'UX Research', 'Prototyping'],
      location: 'New York, NY',
      salaryRange: '$100,000 - $130,000',
      jobType: 'Full-time',
      companyId: company2.id,
      recruiterId: 'mock_user_recruiter',
      views: 18
    }
  ];

  for (const job of jobsData) {
    // Check if job title already exists for that company to prevent duplicates
    const exists = await prisma.job.findFirst({
      where: {
        title: job.title,
        companyId: job.companyId
      }
    });
    if (!exists) {
      await prisma.job.create({ data: job });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
