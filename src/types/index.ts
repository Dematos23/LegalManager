
export type Role = 'ADMIN' | 'MANAGERS' | 'LEGAL' | 'SALES';
export type TrademarkType = 'NOMINATIVE' | 'FIGURATIVE' | 'MIXED';
export type Area = 'CORPORATE' | 'LITIGATION' | 'REGULATORY';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  campaigns?: Campaign[];
}

export interface Class {
  id: number;
  description: string;
  trademarks?: TrademarkClass[];
}

export interface Trademark {
  id: string;
  denomination: string;
  class: string;
  type: TrademarkType;
  certificate: string;
  expiration: Date;
  products?: string | null;
  ownerId: string;
  owner?: Owner;
  createdAt: Date;
  updatedAt: Date;
  trademarkClasses?: TrademarkClass[];
}

export interface Owner {
  id: string;
  name: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  trademarks?: Trademark[];
  ownerContacts?: OwnerContact[];
}

export interface Agent {
  id: string;
  name: string;
  country: string;
  area?: Area | null;
  createdAt: Date;
  updatedAt: Date;
  contacts?: Contact[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  agentId: string;
  agent?: Agent;
  createdAt: Date;
  updatedAt: Date;
  ownerContacts?: OwnerContact[];
  sentEmails?: SentEmail[];
}

export interface OwnerContact {
  ownerId: string;
  contactId: string;
  owner?: Owner;
  contact?: Contact;
  createdAt: Date;
}

export interface TrademarkClass {
  trademarkId: string;
  classId: number;
  trademark?: Trademark;
  class?: Class;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  campaigns?: Campaign[];
}

export interface Campaign {
  id: string;
  name: string;
  userId: string;
  user?: User;
  emailTemplateId?: string | null;
  emailTemplate?: EmailTemplate | null;
  createdAt: Date;
  updatedAt: Date;
  sentEmails?: SentEmail[];
}

export interface SentEmail {
  id: string;
  resendId: string;
  campaignId: string;
  campaign?: Campaign;
  contactId: string;
  contact?: Contact;
  sentAt: Date;
  deliveredAt?: Date | null;
  openedAt?: Date | null;
}
