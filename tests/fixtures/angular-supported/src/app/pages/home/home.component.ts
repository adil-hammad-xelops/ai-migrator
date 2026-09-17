import { Component, OnInit } from "@angular/core";
import { UserCardComponent } from "../../components/user-card/user-card.component";
import { UserService } from "../../services/user.service";
import type { User } from "../../models/user.model";

@Component({
    selector: "app-home-page",
    standalone: true,
    imports: [UserCardComponent],
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {
    public user: User | null = null;

    public constructor(private readonly userService: UserService) { }

    public ngOnInit(): void {
        this.userService.fetchUser("1").subscribe((user) => {
            this.user = user;
        });
    }
}
