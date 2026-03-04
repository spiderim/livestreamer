import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!superAdminEmail) {
    console.log("No SUPER_ADMIN_EMAIL set. Skipping seed.");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existing) {
    if (existing.role !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "SUPER_ADMIN" },
      });
      console.log(`Updated ${superAdminEmail} to SUPER_ADMIN role`);
    } else {
      console.log(`${superAdminEmail} is already SUPER_ADMIN`);
    }
  } else {
    console.log(
      `Super admin ${superAdminEmail} will be auto-assigned on first Google login`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
