"use client";
import { createContext, useContext } from "react";
export type AccountContextValue = { id?: string; mode?: "account" | "demo" };
export const AccountContext = createContext<AccountContextValue>({});
export const useAccount = () => useContext(AccountContext);
