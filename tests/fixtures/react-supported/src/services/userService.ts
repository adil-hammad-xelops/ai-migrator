import type { User } from "../models/User";

export async function fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
        throw new Error(`failed to fetch user ${id}`);
    }
    return (await response.json()) as User;
}
