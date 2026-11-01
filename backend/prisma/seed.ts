import { PrismaClient, TenantRole, UserStatus, TaskStatus, TaskPriority } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'ENTERPRISE',
      settings: {
        theme: 'dark',
        features: { aiAgents: true, automations: true }
      }
    }
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // 2. Hash default password
  const defaultPassword = 'Password123!';
  const passwordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  // 3. Create Users
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@acme.com' },
    update: {},
    create: {
      email: 'owner@acme.com',
      passwordHash,
      fullName: 'Alice Walker (Owner)',
      isEmailVerified: true
    }
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'developer@acme.com' },
    update: {},
    create: {
      email: 'developer@acme.com',
      passwordHash,
      fullName: 'Bob Smith (Engineer)',
      isEmailVerified: true
    }
  });

  // 4. Create Memberships
  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: ownerUser.id } },
    update: { role: TenantRole.OWNER },
    create: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      role: TenantRole.OWNER,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: memberUser.id } },
    update: { role: TenantRole.MEMBER },
    create: {
      tenantId: tenant.id,
      userId: memberUser.id,
      role: TenantRole.MEMBER,
      status: UserStatus.ACTIVE
    }
  });

  // 5. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'engineering' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Engineering',
      slug: 'engineering',
      description: 'Primary software engineering and R&D workspace'
    }
  });

  // 6. Create Workspace Memberships
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: ownerUser.id } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: ownerUser.id,
      role: 'ADMIN'
    }
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: memberUser.id } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: memberUser.id,
      role: 'MEMBER'
    }
  });

  // 7. Create Project
  const project = await prisma.project.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: 'CORE' } },
    update: {},
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Core Platform v1',
      key: 'CORE',
      description: 'Foundation and architecture for AI Work OS'
    }
  });

  // 8. Create Sample Tasks
  const task1 = await prisma.task.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Initialize multi-tenant database & Redis cache',
      description: 'Configure Prisma schema, migrations, and tenant isolation middleware.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      orderIndex: 1.0,
      assignees: {
        create: { userId: ownerUser.id }
      }
    }
  });

  await prisma.task.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      title: 'Implement short-lived JWT & Redis refresh token rotation',
      description: 'Setup Argon2id auth, cookie-based refresh, and token reuse family revocation.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      orderIndex: 2.0,
      assignees: {
        create: { userId: memberUser.id }
      }
    }
  });

  // 9. Create AI Agent
  await prisma.aiAgent.create({
    data: {
      tenantId: tenant.id,
      name: 'WorkOS Sentinel Agent',
      description: 'Intelligent workspace automation & project management assistant.',
      modelName: 'gemini-1.5-pro',
      systemPrompt: 'You are the AI WORK OS Sentinel Agent. Assist team members with task updates, RAG searches, and project analytics.',
      temperature: 0.2,
      allowedTools: ['query_workspace_tasks', 'search_knowledge_base', 'summarize_project_status'],
      isActive: true
    }
  });

  console.log('🎉 Database seeding completed successfully.');
  console.log('Demo Credentials:');
  console.log('  Owner:  owner@acme.com / Password123!');
  console.log('  Member: developer@acme.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
