
import type { Trademark as PrismaTrademark, Owner, Contact, Agent, EmailTemplate, Campaign, SentEmail, OwnerContact, TrademarkClass, Class as PrismaClass } from '@prisma/client';

export * from '@prisma/client';

export type TrademarkWithClasses = PrismaTrademark & {
    trademarkClasses: (TrademarkClass & { class: PrismaClass })[];
};

export type ContactWithAgent = Contact & { agent: Agent };

export type OwnerWithContacts = Owner & {
    ownerContacts: (OwnerContact & {
        contact: ContactWithAgent;
    })[];
};

export type TrademarkWithDetails = TrademarkWithClasses & {
  owner: OwnerWithContacts;
};

export type ContactWithDetails = Contact & {
  agent: Agent;
  ownerContacts: (OwnerContact & {
    owner: Owner & {
        trademarks: TrademarkWithClasses[];
    }
  })[];
};

export type AgentWithDetails = Agent & {
    contacts: (Contact & {
        ownerContacts: (OwnerContact & {
            owner: Owner & {
                trademarks: TrademarkWithClasses[];
            }
        })[];
    })[];
};

export type OwnerWithDetails = Owner & {
  trademarks: TrademarkWithClasses[];
  ownerContacts: (OwnerContact & {
    contact: ContactWithAgent;
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
