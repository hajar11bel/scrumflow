"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/useAuth";

export default function ProtectedLayout({ children }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return (
            <div className="page-loading">
                <span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} />
            </div>
        );
    }

    return children;
}
