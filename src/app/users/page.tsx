
import { getUsers } from '@/lib/data';
import { UsersClient } from '@/components/users-client';
import { MainLayout } from '@/components/main-layout';

export default async function UsersPage() {
    const users = await getUsers();
    return (
        <MainLayout>
            <UsersClient users={users} />
        </MainLayout>
    );
}
