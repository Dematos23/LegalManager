
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { permissions } from '@/config/permissions';
import type { Action } from '@/config/permissions';
import type { User, Role } from '@prisma/client';
import { headers } from 'next/headers';
import prisma from './prisma';

async function getCurrentUser(): Promise<User | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        // Fallback for client-side actions or scenarios where session is not in headers
        const h = headers();
        const userId = h.get('X-User-Id');
        if (userId) {
            return prisma.user.findUnique({ where: { id: userId } });
        }
        return null;
    }
    return session.user as User;
}


export async function checkPermission(action: Action) {
    const user = await getCurrentUser();
    
    if (!user || !user.role) {
        throw new Error('Not authenticated or user has no role.');
    }
    
    const userPermissions = permissions[user.role];
    if (!userPermissions || !userPermissions.actions.includes(action)) {
        throw new Error(`Forbidden: User with role '${user.role}' cannot perform action '${action}'.`);
    }
}
