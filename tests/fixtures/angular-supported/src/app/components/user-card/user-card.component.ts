import { Component, Input } from "@angular/core";
import type { User } from "../../models/user.model";

@Component({
  selector: "app-user-card",
  standalone: true,
  templateUrl: "./user-card.component.html"
})
export class UserCardComponent {
  @Input({ required: true }) public user!: User;
}
