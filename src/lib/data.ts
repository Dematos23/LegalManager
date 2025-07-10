
import prisma from './prisma';
import type { TrademarkWithDetails } from '@/types';

export async function getTrademarks(): Promise<TrademarkWithDetails[]> {
  try {
    const trademarks = await prisma.trademark.findMany({
      include: {
        owner: {
          include: {
            contacts: {
              include: {
                agent: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiration: 'asc',
      },
    });
    return trademarks;
  } catch (error) {
    console.error('Database Error:', error);
    // In a real app, you'd handle this more gracefully
    // For now, returning an empty array to avoid breaking the page.
    return [];
    // throw new Error('Failed to fetch trademarks.');
  }
}

export async function getContacts() {
    try {
        const contacts = await prisma.contact.findMany({
            include: {
                agent: true,
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' }
            ]
        });
        return contacts;
    } catch (error) {
        console.error('Database Error:', error);
        return [];
    }
}

export async function getContactAndTrademarksForEmail(contactEmail: string) {
    try {
        const contact = await prisma.contact.findUnique({
            where: { email: contactEmail },
            include: {
                agent: true,
                owners: {
                    include: {
                        trademarks: true,
                    }
                }
            }
        });

        if (!contact) {
            return { error: 'Contact not found.' };
        }

        const allTrademarks = contact.owners.flatMap(owner => owner.trademarks);

        return { contact, trademarks: allTrademarks };

    } catch (error) {
        console.error('Database Error:', error);
        return { error: 'Failed to fetch data for email generation.' };
    }
}


export async function getContactDetails(id: number) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        agent: true,
        owners: {
          include: {
            trademarks: {
              orderBy: {
                expiration: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc'
          }
        },
      },
    });
    return contact;
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}

    