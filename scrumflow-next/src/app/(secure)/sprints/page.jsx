import { Suspense } from "react";
import Sprints from "@/views/Sprints";

function SprintsFallback() {
    return (
        <div className="page-loading">
            <span
                className="auth-spinner"
                style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }}
            />
        </div>
    );
}

export default function SprintsPage() {
    return (
        <Suspense fallback={<SprintsFallback />}>
            <Sprints />
        </Suspense>
    );
}
