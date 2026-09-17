import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { User } from "../models/User";

interface UserState {
    user: User | null;
}

type UserAction = { type: "SET_USER"; user: User } | { type: "CLEAR_USER" };

function userReducer(state: UserState, action: UserAction): UserState {
    switch (action.type) {
        case "SET_USER":
            return { user: action.user };
        case "CLEAR_USER":
            return { user: null };
        default:
            return state;
    }
}

const UserStateContext = createContext<UserState | undefined>(undefined);
const UserDispatchContext = createContext<Dispatch<UserAction> | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(userReducer, { user: null });
    return (
        <UserStateContext.Provider value={state}>
            <UserDispatchContext.Provider value={dispatch}>{children}</UserDispatchContext.Provider>
        </UserStateContext.Provider>
    );
}

export function useUserState(): UserState {
    const context = useContext(UserStateContext);
    if (!context) {
        throw new Error("useUserState must be used within UserProvider");
    }
    return context;
}

export function useUserDispatch(): Dispatch<UserAction> {
    const context = useContext(UserDispatchContext);
    if (!context) {
        throw new Error("useUserDispatch must be used within UserProvider");
    }
    return context;
}
