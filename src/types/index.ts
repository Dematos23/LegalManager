export interface Agent {
  id: number;
  name: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  agentId: number;
}

export interface Owner {
  id: number;
  name: string;
}

export interface Trademark {
  id: number;
  trademark: string;
  class: string;
  certificate: string;
  expiration: Date;
  ownerId: number;
}

export interface TrademarkWithDetails extends Trademark {
  owner: Owner;
  agent: Agent;
  contact: Contact;
}
