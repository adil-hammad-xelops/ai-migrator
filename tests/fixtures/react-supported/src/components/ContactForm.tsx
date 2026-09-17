import { useState, type FormEvent } from "react";

export interface ContactFormValues {
    name: string;
    message: string;
}

const initialValues: ContactFormValues = { name: "", message: "" };

export interface ContactFormProps {
    onSubmit: (values: ContactFormValues) => void;
}

export function ContactForm({ onSubmit }: ContactFormProps) {
    const [values, setValues] = useState<ContactFormValues>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof ContactFormValues, string>>>({});

    function validate(current: ContactFormValues): Partial<Record<keyof ContactFormValues, string>> {
        const next: Partial<Record<keyof ContactFormValues, string>> = {};
        if (current.name.trim().length === 0) {
            next.name = "Name is required";
        }
        if (current.message.trim().length < 5) {
            next.message = "Message must be at least 5 characters";
        }
        return next;
    }

    function handleReset(): void {
        setValues(initialValues);
        setErrors({});
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const validationErrors = validate(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length === 0) {
            onSubmit(values);
            handleReset();
        }
    }

    return (
        <form onSubmit={handleSubmit} onReset={handleReset}>
            <label>
                Name
                <input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
            </label>
            {errors.name !== undefined && <span role="alert">{errors.name}</span>}
            <label>
                Message
                <textarea
                    value={values.message}
                    onChange={(e) => setValues({ ...values, message: e.target.value })}
                />
            </label>
            {errors.message !== undefined && <span role="alert">{errors.message}</span>}
            <button type="submit">Send</button>
            <button type="reset">Reset</button>
        </form>
    );
}
