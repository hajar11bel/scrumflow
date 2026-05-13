import { useNavigate } from "react-router-dom";

function DeveloperDashboard({ loading, statCards, completionPct }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="page-loading">
                <span className="auth-spinner" />
            </div>
        );
    }

    return (
        <>
            <div className="dash-stats">
                {statCards.map(({ label, value, sub, dot, path }) => (
                    <div
                        key={label}
                        className={`dash-stat-card${path ? " dash-stat-card--interactive" : ""}`}
                        role={path ? "button" : undefined}
                        tabIndex={path ? 0 : undefined}
                        onClick={() => path && navigate(path)}
                        onKeyDown={(e) => {
                            if (!path) return;
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(path);
                            }
                        }}
                    >
                        <div className="dash-stat-top">
                            <span className={`stat-dot dot-${dot}`} />
                            <span className="dash-stat-label">{label}</span>
                        </div>
                        <div className="dash-stat-value">{value}</div>
                        <div className="dash-stat-sub">{sub}</div>
                    </div>
                ))}
            </div>

            <div className="dash-progress-wrap">
                <div className="dash-progress-header">
                    <span className="dash-progress-label">Mon avancement des taches</span>
                    <span className="dash-progress-pct">{completionPct}%</span>
                </div>
                <div className="dash-progress-track">
                    <div className="dash-progress-fill" style={{ width: `${completionPct}%` }} />
                </div>
            </div>
        </>
    );
}

export default DeveloperDashboard;
