import { useUserState } from "../state/UserContext";
import { UserCard } from "../components/UserCard";
import { ContactForm, type ContactFormValues } from "../components/ContactForm";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const { user } = useUserState();

  function handleContactSubmit(values: ContactFormValues): void {
    console.log("contact submitted", values);
  }

  return (
    <section className={styles.profile}>
      <h1>Profile</h1>
      {user !== null && <UserCard user={user} />}
      <ContactForm onSubmit={handleContactSubmit} />
    </section>
  );
}
