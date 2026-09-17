import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import type { Observable } from "rxjs";
import type { User } from "../models/user.model";

@Injectable({ providedIn: "root" })
export class UserService {
    public constructor(private readonly http: HttpClient) { }

    public fetchUser(id: string): Observable<User> {
        return this.http.get<User>(`/api/users/${id}`);
    }
}
