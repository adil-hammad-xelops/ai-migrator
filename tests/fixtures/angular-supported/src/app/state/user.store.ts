import { Injectable, signal } from "@angular/core";
import type { User } from "../models/user.model";

@Injectable({ providedIn: "root" })
export class UserStore {
    private readonly userSignal = signal<User | null>(null);
    public readonly user = this.userSignal.asReadonly();

    public setUser(user: User): void {
        this.userSignal.set(user);
    }

    public clearUser(): void {
        this.userSignal.set(null);
    }
}
