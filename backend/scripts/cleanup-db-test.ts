import { prisma } from '../src/config/prisma';

async function main() {
  await prisma.innovationSupportRequest.deleteMany({ where: { title: { in: ['Database submission test', 'Innovator to administrator verification'] } } });
  await prisma.$disconnect();
}

void main();
