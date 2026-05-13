"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/useAuth";

export default function RoleLayout({ allowedRoles = [], children }) {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user?.role && !allowedRoles.includes(user.role)) {
            router.replace("/dashboard");
        }
    }, [user?.role, allowedRoles, router]);

    if (!user?.role || !allowedRoles.includes(user.role)) {
        return (
            <div className="page-loading">
                <span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} />
            </div>
        );
    }

    return children;
}
