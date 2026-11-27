import { prisma } from '../src/config/prisma';

async function main() {
  await prisma.$executeRawUnsafe(
    'DELETE FROM "_prisma_migrations" WHERE migration_name = \'202611270001_complete_innovation_support\' AND finished_at IS NULL'
  );
  await prisma.$disconnect();
}

void main();
