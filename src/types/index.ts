import type { Trademark, Owner, Contact, Agent } from '@prisma/client';

// Re-export all types from Prisma Client
export * from '@prisma/client';

// Define a composite type for the Trademark table, including its related owner,
// contacts, and agents. This simplifies passing data to components.
export type TrademarkWithDetails = Trademark & {
  owner: Owner & {
    contacts: (Contact & {
      agent: Agent;
    })[];
  };
};
