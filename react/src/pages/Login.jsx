import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate("/dashboard");
        } catch {
            setError("Email ou mot de passe incorrect");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-split">
                {/* Left panel */}
                <div className="auth-left">
                    <div className="auth-grid-bg" />
                    <div className="auth-left-top">
                        <div className="auth-badge">
                            <span className="auth-badge-dot" />
                            <span>SCRUMFLOW v2.0</span>
                        </div>
                        <h1 className="auth-hero">
                            Ship faster,<br />
                            <em>sprint smarter.</em>
                        </h1>
                        <p className="auth-hero-sub">
                            Your agile workspace — backlogs, sprints,<br />and team velocity in one place.
                        </p>
                    </div>
                    <div className="auth-stats">
                        <div className="auth-stat-card">
                            <span className="stat-dot dot-blue" />
                            <span className="stat-label">Sprint 14 · In progress</span>
                            <span className="stat-value">12/18 done</span>
                        </div>
                        <div className="auth-stat-card">
                            <span className="stat-dot dot-green" />
                            <span className="stat-label">Velocity · Last sprint</span>
                            <span className="stat-value">42 pts</span>
                        </div>
                        <div className="auth-stat-card">
                            <span className="stat-dot dot-amber" />
                            <span className="stat-label">Backlog items</span>
                            <span className="stat-value">37 open</span>
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <div className="auth-form-header">
                        <h2 className="auth-form-title">Welcome back</h2>
                        <p className="auth-form-sub">Connectez-vous à votre espace agile</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span className="auth-error-icon">!</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="auth-field">
                            <label className="auth-label">Email</label>
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="you@team.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Mot de passe</label>
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="auth-submit" disabled={loading}>
                            {loading ? (
                                <span className="auth-spinner" />
                            ) : (
                                <>Se connecter <span className="auth-arrow">→</span></>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider" />

                    <p className="auth-footer-link">
                        Pas encore de compte ?{" "}
                        <Link to="/register">Créer un compte</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;