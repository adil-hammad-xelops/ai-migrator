import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { UserProvider } from "./state/UserContext";

export function App() {
    return (
        <UserProvider>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
        </UserProvider>
    );
}
