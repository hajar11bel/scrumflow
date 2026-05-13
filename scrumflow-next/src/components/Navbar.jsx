"use client";

import { useAuth } from "@/context/useAuth";

function Navbar({
    pageTitle = "Dashboard",
    breadcrumb = "ScrumFlow",
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "Rechercher...",
    showSearch = true,
    showNotifications = false,
}) {
    const { user } = useAuth();

    const initials = user?.fullName
        ? user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "??";

    return (
        <header className="navbar">
            <div className="navbar-context">
                <h1 className="navbar-page-title">{pageTitle}</h1>
                <span className="navbar-breadcrumb">{breadcrumb}</span>
            </div>

            <div className="navbar-actions">
                {showSearch && (
                    <div className="navbar-search">
                        <i className="ti ti-search" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                        />
                    </div>
                )}

                {user?.fullName && (
                    <span className="navbar-breadcrumb" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={user.fullName}>
                        {user.fullName}
                    </span>
                )}

                {showNotifications && (
                    <button className="navbar-icon-btn has-dot" aria-label="Notifications" type="button">
                        <i className="ti ti-bell" aria-hidden="true" />
                    </button>
                )}

                <div className="navbar-avatar" title={user?.fullName}>
                    {initials}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
