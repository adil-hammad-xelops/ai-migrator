import { useEffect, useState } from "react";
import { UserCard } from "../components/UserCard";
import { fetchUser } from "../services/userService";
import type { User } from "../models/User";

export function HomePage() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchUser("1")
            .then((fetched) => {
                if (!cancelled) {
                    setUser(fetched);
                }
            })
            .catch(() => {
                // fixture: intake failure surfaces as no card rendered.
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section>
            <h1>Home</h1>
            {user !== null && <UserCard user={user} />}
        </section>
    );
}
