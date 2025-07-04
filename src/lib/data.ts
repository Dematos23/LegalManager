import { add, sub } from 'date-fns';
import type { Agent, Contact, Owner, Trademark, TrademarkWithDetails } from '@/types';

const agents: Agent[] = [
  { id: 1, name: 'LegalFirm A' },
  { id: 2, name: 'Global IP Services' },
];

const contacts: Contact[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', agentId: 1 },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', agentId: 2 },
  { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', agentId: 1 },
];

const owners: Owner[] = [
  { id: 1, name: 'Innovate Corp' },
  { id: 2, name: 'Tech Solutions Ltd.' },
  { id: 3, name: 'Global Goods Inc.' },
];

const trademarks: Trademark[] = [
  {
    id: 1,
    trademark: 'InnovateX',
    class: '9',
    certificate: 'CERT-001',
    expiration: add(new Date(), { days: 25 }),
    ownerId: 1,
  },
  {
    id: 2,
    trademark: 'SecureTech',
    class: '42',
    certificate: 'CERT-002',
    expiration: add(new Date(), { days: 55 }),
    ownerId: 2,
  },
  {
    id: 3,
    trademark: 'MarketMover',
    class: '35',
    certificate: 'CERT-003',
    expiration: add(new Date(), { days: 85 }),
    ownerId: 3,
  },
  {
    id: 4,
    trademark: 'GigaWidget',
    class: '9',
    certificate: 'CERT-004',
    expiration: add(new Date(), { days: 120 }),
    ownerId: 1,
  },
  {
    id: 5,
    trademark: 'FutureProof',
    class: '42',
    certificate: 'CERT-005',
    expiration: sub(new Date(), { days: 10 }),
    ownerId: 2,
  },
   {
    id: 6,
    trademark: 'InnovateX Pro',
    class: '9',
    certificate: 'CERT-006',
    expiration: add(new Date(), { days: 40 }),
    ownerId: 1,
  },
];

// In a real app, this data would be joined in the database.
// Here we simulate that with a function.
export const getTrademarksWithDetails = (): TrademarkWithDetails[] => {
  return trademarks.map((tm) => {
    const owner = owners.find((o) => o.id === tm.ownerId)!;
    
    // This is a simplification. In the real schema, contacts are linked to owners and agents.
    // For this mock, we'll associate owners with contacts somewhat arbitrarily.
    let contact: Contact;
    if (owner.id === 1) contact = contacts.find(c => c.id === 1)!;
    else if (owner.id === 2) contact = contacts.find(c => c.id === 2)!;
    else contact = contacts.find(c => c.id === 3)!;
    
    const agent = agents.find((a) => a.id === contact.agentId)!;

    return {
      ...tm,
      owner,
      agent,
      contact,
    };
  });
};

export const getContactData = (contactEmail: string) => {
    const contact = contacts.find(c => c.email === contactEmail);
    if (!contact) return null;

    const allTrademarks = getTrademarksWithDetails();
    const contactTrademarks = allTrademarks.filter(tm => tm.contact.email === contactEmail);

    return {
        contact,
        trademarks: contactTrademarks,
    }
}
