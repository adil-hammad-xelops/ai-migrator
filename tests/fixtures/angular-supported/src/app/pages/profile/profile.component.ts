import { Component } from "@angular/core";
import { UserCardComponent } from "../../components/user-card/user-card.component";
import { ContactFormComponent } from "../../components/contact-form/contact-form.component";
import { UserStore } from "../../state/user.store";

@Component({
    selector: "app-profile-page",
    standalone: true,
    imports: [UserCardComponent, ContactFormComponent],
    templateUrl: "./profile.component.html",
    styleUrl: "./profile.component.css"
})
export class ProfileComponent {
    public constructor(private readonly userStore: UserStore) { }

    public get user() {
        return this.userStore.user();
    }

    public handleContactSubmit(values: { name: string; message: string }): void {
        console.log("contact submitted", values);
    }
}
