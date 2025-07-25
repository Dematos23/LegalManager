
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { permissions } from '@/config/permissions';
import type { Action } from '@/config/permissions';
import type { User } from '@prisma/client';

async function getCurrentUser(): Promise<User | null> {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
        // The session user object from next-auth is compatible with the Prisma User type
        return session.user as User;
    }
    return null;
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
