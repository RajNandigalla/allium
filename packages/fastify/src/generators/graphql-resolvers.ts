import { ModelDefinition } from '@allium/core';

export function generateResolvers(models: ModelDefinition[]): any {
  const resolvers: any = {
    Query: {},
    Mutation: {},
  };

  for (const model of models) {
    const modelName = model.name;
    const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const pluralName = camelName + 's'; // Simple pluralization
    const prismaModel = camelName; // Prisma client uses camelCase model names

    // Query Resolvers
    resolvers.Query[camelName] = async (
      _: any,
      { id }: any,
      { prisma }: any
    ) => {
      return prisma[prismaModel].findUnique({ where: { id } });
    };

    resolvers.Query[pluralName] = async (
      _: any,
      { limit, offset }: any,
      { prisma }: any
    ) => {
      return prisma[prismaModel].findMany({
        take: limit,
        skip: offset,
      });
    };

    // Mutation Resolvers
    resolvers.Mutation[`create${modelName}`] = async (
      _: any,
      { data }: any,
      { prisma }: any
    ) => {
      return prisma[prismaModel].create({ data });
    };

    resolvers.Mutation[`update${modelName}`] = async (
      _: any,
      { id, data }: any,
      { prisma }: any
    ) => {
      return prisma[prismaModel].update({
        where: { id },
        data,
      });
    };

    resolvers.Mutation[`delete${modelName}`] = async (
      _: any,
      { id }: any,
      { prisma }: any
    ) => {
      return prisma[prismaModel].delete({ where: { id } });
    };

    // Field Resolvers (Relations)
    if (model.relations) {
      resolvers[modelName] = {};

      for (const rel of model.relations) {
        if (rel.type === '1:1' || rel.type === '1:n' || rel.type === 'n:m') {
          resolvers[modelName][rel.name] = async (
            parent: any,
            _: any,
            { prisma }: any
          ) => {
            // Use fluent API for relations
            return prisma[prismaModel]
              .findUnique({ where: { id: parent.id } })
              [rel.name]();
          };
        } else if (rel.type === 'polymorphic' && rel.models) {
          for (const target of rel.models) {
            const fieldName = target.charAt(0).toLowerCase() + target.slice(1);
            resolvers[modelName][fieldName] = async (
              parent: any,
              _: any,
              { prisma }: any
            ) => {
              return prisma[prismaModel]
                .findUnique({ where: { id: parent.id } })
                [fieldName]();
            };
          }
        }
      }
    }
  }

  return resolvers;
}
