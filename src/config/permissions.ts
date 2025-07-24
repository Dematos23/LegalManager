
import type { Role } from "@prisma/client";

// Literal menu keys used in the sidebar component
const allMenus = ['dashboard', 'agents', 'import', 'templates', 'tracking', 'users'];

// Literal routes used in the application
const allRoutes = ['/dashboard', '/agents', '/import', '/templates', '/tracking', '/users', '/send-email', '/owners/[id]', '/contacts/[id]', '/trademarks/[id]', '/trademarks/new', '/trademarks/[id]/edit', '/templates/new', '/templates/edit/[id]', '/templates/[id]/send', '/tracking/[id]', '/agents/[id]', '/owners', '/contacts'];

// Literal action names that will be checked in server actions
const allActions = [
    'user:create', 'user:update', 'user:delete', 'user:reset-password',
    'template:create', 'template:update', 'template:delete',
    'trademark:create', 'trademark:update', 'trademark:delete',
    'owner:update-contacts',
    'campaign:send', 'campaign:sync', 'campaign:delete',
    'data:import',
    'read:data'
];

export type Action = (typeof allActions)[number];

export const permissions: Record<Role, { routes: string[]; actions: Action[]; menus: string[] }> = {
  ADMIN: {
    routes: allRoutes,
    actions: allActions,
    menus: allMenus,
  },
  MANAGERS: {
    routes: allRoutes.filter(route => !route.startsWith('/users')),
    actions: allActions.filter(action => !action.startsWith('user:')) as Action[],
    menus: allMenus.filter(menu => menu !== 'users'),
  },
  LEGAL: {
    routes: ['/dashboard', '/trademarks/[id]', '/owners/[id]'],
    actions: ['trademark:update', 'read:data'],
    menus: ['dashboard'],
  },
  SALES: {
    routes: ['/dashboard', '/agents', '/templates', '/tracking', '/send-email', '/owners', '/contacts', '/trademarks', '/agents/[id]', '/contacts/[id]', '/owners/[id]', '/trademarks/[id]', '/templates/[id]/send'],
    actions: [
        'template:create', 'template:update', 'template:delete',
        'trademark:create', 'trademark:update',
        'owner:update-contacts',
        'campaign:send', 'campaign:sync', 'campaign:delete',
        'read:data'
    ],
    menus: ['dashboard', 'agents', 'templates','tracking'],
  },
} ;
