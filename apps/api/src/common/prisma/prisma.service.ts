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
            try {
              const tenantId = tenantContext.getStore();
              
              // Dynamically check if the model has a tenantId field
              const modelInfo = Prisma.dmmf.datamodel.models.find(m => m.name === model);
              const hasTenantId = modelInfo?.fields.some(f => f.name === 'tenantId');
              
              if (tenantId && hasTenantId) {
                const typedArgs: any = args || {};

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
                return query(typedArgs);
              }

              return query(args);
            } catch (error) {
              console.error(`Prisma Extension Error on ${model}.${operation}:`, error);
              return query(args); // Fallback to un-intercepted query on error
            }
          },
        },
      },
    });
  }
}
