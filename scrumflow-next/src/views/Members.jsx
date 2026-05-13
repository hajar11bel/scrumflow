"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { projectService } from "@/services/projectService";
import { projectMemberService } from "@/services/projectMemberService";
import { userService } from "@/services/userService";
import { useAuth } from "@/context/useAuth";
import { mapProjectMembersToRecords } from "@/utils/projectMemberNormalize";

const roleColor = (r) => ({ SCRUM_MASTER: "blue", DEVELOPER: "green", PRODUCT_OWNER: "amber", ADMIN: "gray" }[r] || "gray");
const roleLabel = (r) => ({ SCRUM_MASTER: "Scrum Master", DEVELOPER: "Développeur", PRODUCT_OWNER: "Product Owner", ADMIN: "Admin" }[r] || r);

function avatarInitials(name) {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#1e3a5f", "#1a3a2a", "#3a1a1a", "#2a1a3a", "#3a2a1a"];

function Members() {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState("");

    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [addingUserId, setAddingUserId] = useState(null);
    const [actionMessage, setActionMessage] = useState("");

    const developerUsers = useMemo(
        () => allUsers.filter((u) => String(u.role) === "DEVELOPER"),
        [allUsers]
    );

    useEffect(() => {
        const loadDirectory = async () => {
            if (user?.role !== "SCRUM_MASTER") {
                setDirectoryLoading(false);
                return;
            }
            try {
                const list = await userService.getAll();
                setAllUsers(Array.isArray(list) ? list : []);
                setDirectoryError("");
            } catch (e) {
                console.error("Annuaire utilisateurs :", e);
                setAllUsers([]);
                setDirectoryError("Impossible de charger l’annuaire (vérifiez que le backend expose GET /api/users).");
            } finally {
                setDirectoryLoading(false);
            }
        };
        loadDirectory();
    }, [user?.role]);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const data = await projectService.getAll();
                setProjects(data);
                if (data.length > 0) {
                    setSelectedProjectId(String(data[0].id));
                }
            } catch (error) {
                console.error("Erreur chargement projets :", error);
            } finally {
                setProjectsLoading(false);
            }
        };

        loadProjects();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) {
            setMembers([]);
            return;
        }

        const loadMembers = async () => {
            setMembersLoading(true);
            setMembers([]);
            try {
                const data = await projectMemberService.getByProject(selectedProjectId);
                setMembers(mapProjectMembersToRecords(data));
            } catch (error) {
                console.error("Erreur chargement membres :", error);
                setMembers([]);
            } finally {
                setMembersLoading(false);
            }
        };

        loadMembers();
    }, [selectedProjectId]);

    const memberUserIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

    const q = search.toLowerCase().trim();
    const matchesSearch = (m) =>
        !q ||
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        String(m.id).includes(q) ||
        (m.role && String(m.role).toLowerCase().includes(q));

    const filteredMembers = members.filter(matchesSearch);
    const filteredDirectory = developerUsers.filter(matchesSearch);

    const countByRole = (r) => members.filter(m => m.role === r).length;

    const handleAddUserToProject = async (userId) => {
        if (!selectedProjectId) return;
        setAddingUserId(userId);
        setActionMessage("");
        try {
            await projectMemberService.addToProject(userId, selectedProjectId);
            const refreshed = await projectMemberService.getByProject(selectedProjectId);
            setMembers(mapProjectMembersToRecords(refreshed));
            setActionMessage("Membre ajouté au projet.");
        } catch (error) {
            console.error("Erreur affectation membre :", error);
            setActionMessage("Échec de l’ajout (utilisateur ou projet introuvable, ou erreur serveur).");
        } finally {
            setAddingUserId(null);
        }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Navbar
                    pageTitle="Members"
                    breadcrumb="ScrumFlow · Équipe"
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Filtrer l’annuaire et l’équipe du projet…"
                />
                <div className="page-content">

                    <div className="dash-header">
                        <div>
                            <h2 className="dash-title">Membres</h2>
                            <span className="dash-subtitle">
                                Développeurs disponibles + équipe du projet sélectionné
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <select
                                className="auth-input"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                style={{ width: 260, height: 36 }}
                                disabled={projectsLoading || projects.length === 0}
                            >
                                {projects.length === 0 && <option value="">Aucun projet</option>}
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {actionMessage && (
                        <p className="dash-subtitle" style={{ marginBottom: 10 }}>{actionMessage}</p>
                    )}

                    <div className="tasks-stats">
                        {["SCRUM_MASTER", "PRODUCT_OWNER", "DEVELOPER"].map(r => (
                            <div key={r} className="task-stat-pill">
                                <span className={`sdot-lg dot-${roleColor(r)}`} />
                                <span className="task-stat-label">{roleLabel(r)}</span>
                                <span className="task-stat-count">{countByRole(r)}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
                        <section>
                            <h3 className="dash-title" style={{ fontSize: 18, marginBottom: 8 }}>Annuaire — développeurs</h3>
                            <p className="dash-subtitle" style={{ marginBottom: 12 }}>
                                Seuls les développeurs peuvent être affectés au travail du projet. Ajoutez-les un par un.
                            </p>
                            {user?.role !== "SCRUM_MASTER" && (
                                <p className="dash-subtitle">Réservé au Scrum Master.</p>
                            )}
                            {user?.role === "SCRUM_MASTER" && directoryLoading && (
                                <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                            )}
                            {user?.role === "SCRUM_MASTER" && !directoryLoading && directoryError && (
                                <p className="dash-subtitle">{directoryError}</p>
                            )}
                            {user?.role === "SCRUM_MASTER" && !directoryLoading && !directoryError && (
                                <div className="members-grid">
                                    {filteredDirectory.length === 0 ? (
                                        <div className="page-empty" style={{ gridColumn: "1 / -1" }}>
                                            <p>{q ? "Aucun résultat" : "Aucun développeur dans l’annuaire"}</p>
                                        </div>
                                    ) : (
                                        filteredDirectory.map((u, i) => {
                                            const onProject = memberUserIds.has(u.id);
                                            return (
                                                <div key={u.id} className="member-card">
                                                    <div className="member-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                                                        {avatarInitials(u.fullName)}
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="member-name">{u.fullName}</span>
                                                        <span className="member-email">{u.email}</span>
                                                        <span className={`status-badge status-${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
                                                    </div>
                                                    <div className="member-stats">
                                                        <span className="member-stat"><i className="ti ti-id-badge" aria-hidden="true" /> ID {u.id}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="dash-btn-outline primary"
                                                        style={{ marginTop: 8, width: "100%", flexBasis: "100%" }}
                                                        disabled={!selectedProjectId || onProject || addingUserId === u.id}
                                                        onClick={() => handleAddUserToProject(u.id)}
                                                    >
                                                        {onProject ? "Déjà sur le projet" : addingUserId === u.id ? "Ajout…" : "Ajouter au projet"}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </section>

                        <section>
                            <h3 className="dash-title" style={{ fontSize: 18, marginBottom: 8 }}>Équipe du projet</h3>
                            <p className="dash-subtitle" style={{ marginBottom: 12 }}>
                                {selectedProjectId
                                    ? `${members.length} membre${members.length !== 1 ? "s" : ""} sur ce projet`
                                    : "Choisissez un projet"}
                            </p>
                            {projectsLoading ? (
                                <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                            ) : membersLoading ? (
                                <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="page-empty">
                                    <i className="ti ti-users" style={{ fontSize: 40, color: "#cbd5e1" }} aria-hidden="true" />
                                    <p>{q ? "Aucun résultat dans l’équipe" : "Aucun membre sur ce projet"}</p>
                                </div>
                            ) : (
                                <div className="members-grid">
                                    {filteredMembers.map((m, i) => (
                                        <div key={`${m.id}-${i}`} className="member-card">
                                            <div className="member-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                                                {avatarInitials(m.fullName)}
                                            </div>
                                            <div className="member-info">
                                                <span className="member-name">{m.fullName}</span>
                                                <span className="member-email">{m.email}</span>
                                                <span className={`status-badge status-${roleColor(m.role)}`}>{roleLabel(m.role)}</span>
                                            </div>
                                            <div className="member-stats">
                                                <span className="member-stat"><i className="ti ti-id-badge" aria-hidden="true" /> ID {m.id}</span>
                                                <span className="member-stat"><i className="ti ti-folder" aria-hidden="true" /> Projet #{selectedProjectId}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Members;
