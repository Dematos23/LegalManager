
import type { Role } from "@prisma/client";

const allMenus = ['dashboard', 'agents', 'import', 'templates', 'tracking', 'users'];
const allRoutes = ['/', '/agents', '/import', '/templates', '/tracking', '/users'];

const allActions = [
    'create_contacts', 'view_contacts', 'update_contacts',
    'create_trademarks', 'view_trademarks', 'update_trademarks',
    'create_agents', 'view_agents', 'update_agents',
    'create_owners', 'view_owners', 'update_owners',
    'create_templates', 'view_templates', 'update_templates',
    'create_campaigns', 'view_campaigns', 'update_campaigns',
    'view_sentEmail', 'view_trademarksClasses',
    'manage_users'
];

export type Action = typeof allActions[number];

export const permissions: Record<Role, { routes: string[]; actions: Action[]; menus: string[] }> = {
  ADMIN: {
    routes: allRoutes,
    actions: allActions,
    menus: allMenus,
  },
  MANAGERS: {
   routes: allRoutes.filter(route => route !== '/users'),
    actions: allActions.filter(action => action !== 'manage_users') as Action[],
    menus: allMenus.filter(menu => menu !== 'users'),
  },
  LEGAL: {
    routes: ['/', '/trademarks', '/owners'],
    actions: ['view_trademarks', 'update_trademarks', 'view_owners', 'view_trademarksClasses'],
    menus: ['dashboard'],
  },
  SALES: {
    routes: ['/', '/agents', '/contacts', '/templates', '/tracking'],
    actions: [
        'create_contacts','view_contacts', 'update_contacts', 
        'create_trademarks','view_trademarks', 'update_trademarks', 
        'create_agents', 'view_agents', 'update_agents', 
        'create_owners', 'view_owners', 'update_owners', 
        'create_templates', 'view_templates', 'update_templates',
        'create_campaigns', 'view_campaigns', 'update_campaigns', 'view_sentEmail',
        'view_trademarksClasses'
    ],
    menus: ['dashboard', 'agents', 'templates','tracking'],
  },
} ;
