import prisma from "../config/prisma";

const seedMetrics = async () => {
  const existing = await prisma.systemMetric.findFirst();

  if (!existing) {
    await prisma.systemMetric.create({
      data: {},
    });

    console.log("System metrics initialized");
  }
};

seedMetrics()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
