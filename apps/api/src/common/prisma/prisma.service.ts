import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@salesk/db';
import { tenantContext } from '../middlewares/tenant.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  
  // Expose the extended client
  public readonly extended: ReturnType<typeof this.getExtendedClient>;

  constructor() {
    super();
    this.extended = this.getExtendedClient();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private getExtendedClient() {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = tenantContext.getStore();
            
            // Models that DO NOT have a tenantId field
            const globallySharedModels = ['Tenant', 'Subscription', 'Invoice'];
            
            if (tenantId && !globallySharedModels.includes(model)) {
              const typedArgs: any = args;

              // Automatically inject tenantId into where clause
              if (['findUnique', 'findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                typedArgs.where = { ...typedArgs.where, tenantId };
              }
              
              // Automatically inject tenantId into create clause
              if (['create', 'createMany'].includes(operation)) {
                if (Array.isArray(typedArgs.data)) {
                  typedArgs.data = typedArgs.data.map((d: any) => ({ ...d, tenantId }));
                } else {
                  typedArgs.data = { ...typedArgs.data, tenantId };
                }
              }
              
              // Upsert needs both
              if (operation === 'upsert') {
                typedArgs.where = { ...typedArgs.where, tenantId };
                typedArgs.create = { ...typedArgs.create, tenantId };
                typedArgs.update = { ...typedArgs.update, tenantId };
              }
            }

            return query(args);
          },
        },
      },
    });
  }
}
