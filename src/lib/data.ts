
import prisma from './prisma';
import type { TrademarkWithDetails } from '@/types';

export async function getTrademarks() {
  try {
    const trademarks = await prisma.trademark.findMany({
      include: {
        trademarkClasses: {
            include: {
                class: true
            }
        },
        owner: {
          include: {
            ownerContacts: {
              include: {
                contact: {
                    include: {
                        agent: true
                    }
                }
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
    return [];
  }
}

export async function getTrademarkDetails(id: number) {
  try {
    const trademark = await prisma.trademark.findUnique({
      where: { id },
      include: {
        trademarkClasses: {
          include: {
            class: true,
          },
        },
        owner: {
          include: {
            ownerContacts: {
              include: {
                contact: {
                  include: {
                    agent: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return trademark as TrademarkWithDetails;
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}

export async function getContacts() {
    try {
        const contacts = await prisma.contact.findMany({
            include: {
                agent: true,
                ownerContacts: {
                    include: {
                        owner: true
                    }
                }
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


export async function getContactDetails(id: number) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        agent: true,
        ownerContacts: {
          include: {
            owner: {
                include: {
                    trademarks: {
                        include: {
                            trademarkClasses: {
                                include: {
                                    class: true
                                }
                            }
                        },
                        orderBy: {
                            expiration: 'asc',
                        },
                    }
                }
            }
          },
        },
      },
    });
    return contact;
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}

export async function getAgentDetails(id: number) {
    try {
        const agent = await prisma.agent.findUnique({
            where: { id },
            include: {
                contacts: {
                    include: {
                        ownerContacts: {
                            include: {
                                owner: {
                                    include: {
                                        trademarks: {
                                            include: {
                                                trademarkClasses: {
                                                    include: {
                                                        class: true
                                                    }
                                                }
                                            },
                                            orderBy: {
                                                expiration: 'asc',
                                            },
                                        },
                                    },
                                }
                            }
                        }
                    },
                    orderBy: {
                        firstName: 'asc',
                    },
                },
            },
        });
        return agent;
    } catch (error) {
        console.error('Database Error:', error);
        return null;
    }
}

export async function getOwnerDetails(id: number) {
    try {
        const owner = await prisma.owner.findUnique({
            where: { id },
            include: {
                trademarks: {
                     include: {
                        trademarkClasses: {
                            include: {
                                class: true
                            }
                        }
                    },
                    orderBy: {
                        expiration: 'asc'
                    }
                },
                ownerContacts: {
                    include: {
                        contact: {
                            include: {
                                agent: true
                            }
                        }
                    },
                }
            }
        });
        return owner;
    } catch (error) {
        console.error('Database Error:', error);
        return null;
    }
}

export async function getAgents() {
  try {
    return await prisma.agent.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}
