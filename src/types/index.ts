
import type { Trademark, Owner, Contact, Agent, EmailTemplate, Campaign, SentEmail } from '@prisma/client';

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

// Define a composite type for the Contact detail view.
export type ContactWithDetails = Contact & {
  agent: Agent;
  owners: (Owner & {
    trademarks: Trademark[];
  })[];
};

// Define a composite type for the Agent detail view.
export type AgentWithDetails = Agent & {
    contacts: (Contact & {
        owners: (Owner & {
            trademarks: Trademark[];
        })[];
    })[];
};

// Define a composite type for the Owner detail view.
export type OwnerWithDetails = Owner & {
  trademarks: Trademark[];
  contacts: (Contact & {
    agent: Agent;
  })[];
};


// New types for campaign tracking
export type CampaignWithDetails = Campaign & {
  emailTemplate: EmailTemplate;
  _count: {
    sentEmails: number;
  };
};

export type CampaignDetails = Campaign & {
    emailTemplate: EmailTemplate;
    sentEmails: (SentEmail & {
        contact: Contact
    })[];
};
