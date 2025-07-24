
import type { Role } from "@prisma/client";

// Literal menu keys used in the sidebar component
const allMenus = ['dashboard', 'agents', 'import', 'templates', 'tracking', 'users'];

// Literal routes used in the application
const allRoutes = ['/dashboard', '/agents', '/import', '/templates', '/tracking', '/users', '/send-email', '/owners', '/contacts', '/trademarks'];

// Literal action names that will be checked in server actions
const allActions = [
    'user:create', 'user:update', 'user:delete', 'user:reset-password',
    'template:create', 'template:update', 'template:delete',
    'trademark:create', 'trademark:update', 'trademark:delete',
    'owner:update-contacts',
    'campaign:send', 'campaign:sync', 'campaign:delete',
    'data:import',
];

export type Action = (typeof allActions)[number];

export const permissions: Record<Role, { routes: string[]; actions: Action[]; menus: string[] }> = {
  ADMIN: {
    routes: allRoutes,
    actions: allActions,
    menus: allMenus,
  },
  MANAGERS: {
    routes: allRoutes.filter(route => !['/users'].includes(route)),
    actions: allActions.filter(action => !action.startsWith('user:')) as Action[],
    menus: allMenus.filter(menu => menu !== 'users'),
  },
  LEGAL: {
    routes: ['/dashboard', '/trademarks', '/owners'],
    actions: ['trademark:update'],
    menus: ['dashboard'],
  },
  SALES: {
    routes: ['/dashboard', '/agents', '/templates', '/tracking', '/send-email', '/owners', '/contacts', '/trademarks'],
    actions: [
        'template:create', 'template:update', 'template:delete',
        'trademark:create', 'trademark:update',
        'owner:update-contacts',
        'campaign:send', 'campaign:sync', 'campaign:delete',
    ],
    menus: ['dashboard', 'agents', 'templates','tracking'],
  },
} ;
