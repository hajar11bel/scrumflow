"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/useAuth";

function Register() {
    const router = useRouter();
    const { register } = useAuth();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("DEVELOPER");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(fullName, email, password, role);
            router.push("/");
        } catch {
            setError("Erreur lors de la création du compte");
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
                            Join the team,<br />
                            <em>start shipping.</em>
                        </h1>
                        <p className="auth-hero-sub">
                            Create your account and collaborate with<br />your team in seconds.
                        </p>
                    </div>
                    <div className="auth-stats">
                        <div className="auth-stat-card">
                            <span className="stat-dot dot-blue" />
                            <span className="stat-label">Active teams</span>
                            <span className="stat-value">1,240+</span>
                        </div>
                        <div className="auth-stat-card">
                            <span className="stat-dot dot-green" />
                            <span className="stat-label">Sprints completed</span>
                            <span className="stat-value">98k</span>
                        </div>
                        <div className="auth-stat-card">
                            <span className="stat-dot dot-amber" />
                            <span className="stat-label">Stories delivered</span>
                            <span className="stat-value">2.4M</span>
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <div className="auth-form-header">
                        <h2 className="auth-form-title">Créer un compte</h2>
                        <p className="auth-form-sub">Rejoignez ScrumFlow dès maintenant</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span className="auth-error-icon">!</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="auth-field">
                            <label className="auth-label">Nom complet</label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Jane Dupont"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

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

                        <div className="auth-field">
                            <label className="auth-label">Rôle</label>
                            <select
                                className="auth-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                            >
                                <option value="PRODUCT_OWNER">Product Owner</option>
                                <option value="SCRUM_MASTER">Scrum Master</option>
                                <option value="DEVELOPER">Developer</option>
                            </select>
                        </div>

                        <button className="auth-submit" disabled={loading}>
                            {loading ? (
                                <span className="auth-spinner" />
                            ) : (
                                <>S'inscrire <span className="auth-arrow">→</span></>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider" />

                    <p className="auth-footer-link">
                        Déjà un compte ?{" "}
                        <Link href="/">Se connecter</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;