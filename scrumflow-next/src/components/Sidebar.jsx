"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/useAuth";

const allNavItems = [
    {
        label: "Dashboard",
        icon: "ti-layout-dashboard",
        to: "/dashboard",
        roles: ["PRODUCT_OWNER", "SCRUM_MASTER", "DEVELOPER"]
    },
    {
        label: "Projets",
        icon: "ti-folder",
        to: "/projects",
        roles: ["PRODUCT_OWNER", "SCRUM_MASTER"]
    },
    {
        label: "Backlog",
        icon: "ti-list-check",
        to: "/backlog",
        roles: ["PRODUCT_OWNER"]
    },
    {
        label: "Sprints",
        icon: "ti-player-play",
        to: "/sprints",
        roles: ["SCRUM_MASTER"]
    },
    {
        label: "Tasks",
        icon: "ti-checkbox",
        to: "/tasks",
        roles: ["DEVELOPER", "SCRUM_MASTER"]
    },
];

const teamItems = [
    {
        label: "Members",
        icon: "ti-users",
        to: "/members",
        roles: ["SCRUM_MASTER"]
    },
];

function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const role = user?.role;

    const navItems = allNavItems.filter(item =>
        item.roles.includes(role)
    );

    const filteredTeamItems = teamItems.filter(item =>
        item.roles.includes(role)
    );

    const initials = user?.fullName
        ? user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "??";

    return (
        <aside className="sidebar">
            <div className="sb-grid-bg" />

            <div className="sb-inner">
                <div className="sb-logo">
                    <div className="sb-logo-icon">SF</div>
                    <div>
                        <div className="sb-logo-name">ScrumFlow</div>
                        <div className="sb-logo-tag">v2.0 · AGILE</div>
                    </div>
                </div>

                <nav className="sb-nav">
                    <span className="sb-section-label">Workspace</span>

                    {navItems.map(({ label, icon, to }) => (
                        <Link
                            key={to}
                            href={to}
                            className={`sb-link ${pathname === to ? "active" : ""}`}
                        >
                            <i className={`ti ${icon}`} aria-hidden="true" />
                            {label}
                        </Link>
                    ))}

                    {filteredTeamItems.length > 0 && (
                        <>
                            <span className="sb-section-label" style={{ marginTop: "20px" }}>
                                Team
                            </span>

                            {filteredTeamItems.map(({ label, icon, to }) => (
                                <Link
                                    key={to}
                                    href={to}
                                    className={`sb-link ${pathname === to ? "active" : ""}`}
                                >
                                    <i className={`ti ${icon}`} aria-hidden="true" />
                                    {label}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>
            </div>

            <div className="sb-user">
                <div className="sb-avatar">{initials}</div>
                <div className="sb-user-info">
                    <span className="sb-user-name">{user?.fullName || "User"}</span>
                    <span className="sb-user-role">{user?.role || "Member"}</span>
                </div>

                <button
                    className="sb-logout"
                    onClick={logout}
                    title="Se déconnecter"
                    aria-label="Se déconnecter"
                >
                    <i className="ti ti-logout" aria-hidden="true" />
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;