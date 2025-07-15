import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Template 1: Multi-trademark and Multi-owner
  await prisma.emailTemplate.upsert({
    where: { name: 'Multi-trademark and Multi-owner' },
    update: {},
    create: {
      name: 'Multi-trademark and Multi-owner',
      subject: 'Important Update on Your Trademarks',
      body: `Agent name: {{agent.name}}
Agente country: {{agent.country}}
Agent area: {{agent.area}}

Contact name: {{contact.firstName}} {{contact.lastName}}
Contact email: {{contact.email}}

{{#each owners}}

----------------------------------------------------------------
----------------------------------------------------------------
Owner name: {{name}}
Owner country: {{country}}


{{#each trademarks}}
Trademark denomination: {{denomination}}
Trademark class: {{class}}
Trademark certificate: {{certificate}}
Trademark expiration: {{expiration}}
Trademark products: {{products}}
----------------------------------------------------------------
{{/each}}
{{/each}}`,
    },
  });
  console.log('Created "Multi-trademark and Multi-owner" template.');

  // Template 2: Multi-trademark with no owner
  await prisma.emailTemplate.upsert({
    where: { name: 'Multi-trademark (No Owner)' },
    update: {},
    create: {
      name: 'Multi-trademark (No Owner)',
      subject: 'Your Trademark Portfolio Update',
      body: `Agent name: {{agent.name}}
Agente country: {{agent.country}}
Agent area: {{agent.area}}

Contact name: {{contact.firstName}} {{contact.lastName}}
Contact email: {{contact.email}}

{{#each trademarks}}
Trademark denomination: {{denomination}}
Trademark class: {{class}}
Trademark certificate: {{certificate}}
Trademark expiration: {{expiration}}
Trademark products: {{products}}
{{/each}}`,
    },
  });
  console.log('Created "Multi-trademark (No Owner)" template.');

  // Template 3: Single trademark
  await prisma.emailTemplate.upsert({
    where: { name: 'Single Trademark Notification' },
    update: {},
    create: {
      name: 'Single Trademark Notification',
      subject: 'Notification for Trademark: {{denomination}}',
      body: `Agent name: {{agent.name}}
Agente country: {{agent.country}}
Agent area: {{agent.area}}

Contact name: {{contact.firstName}} {{contact.lastName}}
Contact email: {{contact.email}}

Owner name: {{owner.name}}
Owner country: {{owner.country}}

Trademark denomination: {{denomination}}
Trademark class: {{class}}
Trademark certificate: {{certificate}}
Trademark expiration: {{expiration}}
Trademark products: {{products}}`,
    },
  });
  console.log('Created "Single Trademark Notification" template.');

  // Template 4: Plain text
  await prisma.emailTemplate.upsert({
    where: { name: 'Plain Text Example' },
    update: {},
    create: {
      name: 'Plain Text Example',
      subject: 'General Information',
      body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum fermentum nunc, in viverra quam commodo sit amet. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nullam magna arcu, volutpat ac nisi a, commodo lobortis nibh. Aenean pharetra leo vitae erat vestibulum consectetur. Vestibulum vel sagittis tellus, id pretium urna. Vivamus convallis egestas nulla suscipit pulvinar. Donec nec ipsum vel arcu gravida molestie iaculis euismod felis. Morbi et ante in est tempor tempus eu eu arcu. Suspendisse arcu magna, ullamcorper vel commodo quis, aliquam eget sapien. Pellentesque vel nibh et nulla bibendum mollis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Fusce sit amet facilisis ligula, eu commodo libero.

Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Suspendisse vitae semper urna, sit amet aliquam nunc. Donec id sodales mauris. Maecenas facilisis eros dolor, a iaculis mauris luctus id. Cras non ipsum scelerisque, tincidunt quam pellentesque, aliquam odio. Sed commodo eros orci, ac varius arcu porttitor at. Aenean id leo vitae neque condimentum eleifend at id tortor. Maecenas euismod mauris ac congue dignissim.

Sed aliquam ante sit amet nisi rhoncus iaculis. Phasellus laoreet, dui non imperdiet ultrices, mauris diam rhoncus enim, ac feugiat augue orci a lorem. Morbi mattis efficitur tellus sit amet varius. In sem arcu, malesuada non tellus vel, congue tristique dolor. Morbi lacus nunc, finibus non dolor at, feugiat posuere purus. Ut accumsan metus purus, lobortis mollis nisl convallis nec. Sed nec odio quis sapien pharetra consectetur.`,
    },
  });
  console.log('Created "Plain Text Example" template.');

  // Template 5: Six-Month Expiration Notice
  await prisma.emailTemplate.upsert({
    where: { name: 'Six-Month Expiration Notice' },
    update: {},
    create: {
      name: 'Six-Month Expiration Notice',
      subject: 'Upcoming Trademark Expiration',
      body: `Dear {{contact.firstName}} {{contact.lastName}},

Our records indicate that the following trademark registration(s) are set to expire in less than six months. Please be aware that once a trademark exceeds six months past its expiration date, it becomes susceptible to actions from third parties. To maintain your rights and avoid potential risks, we strongly recommend renewing the listed trademark(s) at your earliest convenience.

{{#each trademarks}}
Trademark: {{denomination}}
Class: {{class}}
Registration Number: {{certificate}}
Expiration Date: {{expiration}}
---------------------------------------------------
{{/each}}

Please be aware that once a trademark exceeds six months past its expiration date, it becomes susceptible to actions from third parties. To maintain your rights and avoid potential risks, we strongly recommend renewing the listed trademark(s) at your earliest convenience.

Should you require any assistance with the renewal process, we are here to help.

We look forward to your confirmation.

Best regards,`,
    },
  });
  console.log('Created "Six-Month Expiration Notice" template.');
  
  // Template 6: Holiday Office Closure
  await prisma.emailTemplate.upsert({
    where: { name: 'Holiday Office Closure' },
    update: {},
    create: {
      name: 'Holiday Office Closure',
      subject: 'Office Closure Notification',
      body: `Dear {{contact.firstName}},

We hope this message finds you well.

We would like to inform you that our offices will be closed from July 27th to July 29th due to the celebration of Peruvian Independence Holidays. During this period, our team will not be available to respond to emails or process requests.

Regular operations will resume on Tuesday, July 30th.

We appreciate your understanding and wish you a great week.

Warm regards,`,
    },
  });
  console.log('Created "Holiday Office Closure" template.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
