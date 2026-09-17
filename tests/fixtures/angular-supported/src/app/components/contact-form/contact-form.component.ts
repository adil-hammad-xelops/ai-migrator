import { Component, EventEmitter, Output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";

@Component({
    selector: "app-contact-form",
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: "./contact-form.component.html"
})
export class ContactFormComponent {
    @Output() public readonly submitted = new EventEmitter<{ name: string; message: string }>();

    private readonly fb = new FormBuilder();
    public readonly form = this.fb.nonNullable.group({
        name: ["", [Validators.required]],
        message: ["", [Validators.required, Validators.minLength(5)]]
    });

    public handleSubmit(): void {
        if (this.form.valid) {
            this.submitted.emit(this.form.getRawValue());
            this.handleReset();
        }
    }

    public handleReset(): void {
        this.form.reset({ name: "", message: "" });
    }
}
