
import { getUsers } from '@/lib/data';
import { UsersClient } from '@/components/users-client';

export default async function UsersPage() {
    const users = await getUsers();
    return (
        <UsersClient users={users} />
    );
}
