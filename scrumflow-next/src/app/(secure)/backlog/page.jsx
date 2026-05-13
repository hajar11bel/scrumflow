import { Suspense } from "react";
import Backlog from "@/views/Backlog";

function BacklogFallback() {
    return (
        <div className="page-loading">
            <span
                className="auth-spinner"
                style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }}
            />
        </div>
    );
}

export default function BacklogPage() {
    return (
        <Suspense fallback={<BacklogFallback />}>
            <Backlog />
        </Suspense>
    );
}
