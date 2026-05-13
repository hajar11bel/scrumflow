import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";
import { projectService } from "../services/projectService";
import { sprintService } from "../services/sprintService";
import { taskService } from "../services/taskService";
import "../App.css";

const PROJECT_STATUSES = ["PLANIFIE", "EN_COURS", "TERMINE"];

function normalizeProjectStatusForForm(s) {
    if (PROJECT_STATUSES.includes(s)) return s;
    return {
        ACTIVE: "EN_COURS",
        COMPLETED: "TERMINE",
        PLANNED: "PLANIFIE",
        ON_HOLD: "PLANIFIE",
    }[s] || "PLANIFIE";
}

const statusColor = (s) => ({
    PLANIFIE: "amber",
    EN_COURS: "blue",
    TERMINE: "green",
    ACTIVE: "blue",
    COMPLETED: "green",
    ON_HOLD: "amber",
    PLANNED: "amber",
}[s] || "gray");

const statusLabel = (s) => ({
    PLANIFIE: "Planifié",
    EN_COURS: "En cours",
    TERMINE: "Terminé",
    ACTIVE: "Actif",
    COMPLETED: "Terminé",
    ON_HOLD: "En pause",
    PLANNED: "Planifié",
}[s] || s);

function Projects() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isProductOwner = user?.role === "PRODUCT_OWNER";
    const isScrumMaster = user?.role === "SCRUM_MASTER";
    const canCreateProject = isProductOwner;
    const cardOpensWorkspace = isProductOwner || isScrumMaster;
    const [projects, setProjects] = useState([]);
    const [projectMetrics, setProjectMetrics] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
    });
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "PLANIFIE",
    });

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const data = await projectService.getAll();
                setProjects(data);

                const metricsEntries = await Promise.all(
                    data.map(async (project) => {
                        try {
                            const sprints = await sprintService.getByProject(project.id);
                            const sprintTaskLists = await Promise.all(
                                sprints.map((sprint) => taskService.getBySprint(sprint.id))
                            );

                            const allTasks = sprintTaskLists.flat();
                            const doneCount = allTasks.filter((task) => task.status === "DONE").length;
                            const progress = allTasks.length === 0
                                ? 0
                                : Math.round((doneCount / allTasks.length) * 100);

                            return [project.id, {
                                sprintCount: sprints.length,
                                progress,
                            }];
                        } catch {
                            return [project.id, { sprintCount: 0, progress: 0 }];
                        }
                    })
                );

                setProjectMetrics(Object.fromEntries(metricsEntries));
            } catch (error) {
                console.error("Erreur chargement projets :", error);
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();

        try {
            const response = await projectService.create(form);

            setProjects(prev => [response, ...prev]);
            setShowModal(false);
            setForm({ name: "", description: "", startDate: "", endDate: "" });

        } catch (error) {
            console.error("Erreur création projet :", error);
        }
    };

    const openEdit = (project) => {
        setEditingProject(project);
        setEditForm({
            name: project.name ?? "",
            description: project.description ?? "",
            startDate: project.startDate ?? "",
            endDate: project.endDate ?? "",
            status: normalizeProjectStatusForForm(project.status),
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingProject?.id) return;

        try {
            const payload = {
                name: editForm.name,
                description: editForm.description,
                startDate: editForm.startDate,
                endDate: editForm.endDate,
                status: editForm.status,
            };
            const updated = await projectService.update(editingProject.id, payload);
            setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setShowEditModal(false);
            setEditingProject(null);
        } catch (error) {
            console.error("Erreur mise à jour projet :", error);
        }
    };

    const handleCardActivate = (project) => {
        if (isProductOwner) {
            navigate(`/backlog?project=${project.id}`);
        } else if (isScrumMaster) {
            navigate(`/sprints?project=${project.id}`);
        }
    };

    const filteredProjects = projects.filter((project) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
            project.name?.toLowerCase().includes(q) ||
            project.description?.toLowerCase().includes(q) ||
            statusLabel(project.status)?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="layout">
            <Sidebar />

            <div className="main-content">
                <Navbar
                    pageTitle="Projets"
                    breadcrumb="ScrumFlow · Projets"
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Rechercher un projet..."
                />

                <div className="page-content">
                    <div className="dash-header">
                        <div>
                            <h2 className="dash-title">Projets</h2>
                            <span className="dash-subtitle">
                                {filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""} affiché{filteredProjects.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {canCreateProject && (
                                <button className="dash-btn-outline primary" onClick={() => setShowModal(true)}>
                                    <i className="ti ti-plus" /> Nouveau projet
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="page-loading">
                            <span className="auth-spinner" />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="page-empty">
                            <i className="ti ti-folder-off" style={{ fontSize: 40, color: "#cbd5e1" }} />
                            <p>{projects.length === 0 ? "Aucun projet pour le moment" : "Aucun projet ne correspond à la recherche"}</p>
                            {projects.length === 0 && canCreateProject && (
                                <button className="dash-btn-outline primary" onClick={() => setShowModal(true)}>
                                    Créer votre premier projet
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {filteredProjects.map(p => (
                                <div
                                    key={p.id}
                                    className="project-card"
                                    role={cardOpensWorkspace ? "button" : undefined}
                                    tabIndex={cardOpensWorkspace ? 0 : undefined}
                                    onClick={() => cardOpensWorkspace && handleCardActivate(p)}
                                    onKeyDown={(e) => {
                                        if (!cardOpensWorkspace) return;
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleCardActivate(p);
                                        }
                                    }}
                                    style={cardOpensWorkspace ? { cursor: "pointer" } : undefined}
                                >
                                    <div className="project-card-top">
                                        <div className="project-icon">
                                            {p.name?.[0]?.toUpperCase() ?? "P"}
                                        </div>
                                        <span className={`status-badge status-${statusColor(p.status)}`}>
                                            {statusLabel(p.status)}
                                        </span>
                                    </div>

                                    {isProductOwner && (
                                        <p className="dash-subtitle" style={{ margin: "0 0 8px" }}>Cliquez pour ouvrir le backlog de ce projet</p>
                                    )}
                                    {isScrumMaster && (
                                        <p className="dash-subtitle" style={{ margin: "0 0 8px" }}>Cliquez pour ouvrir les sprints de ce projet</p>
                                    )}

                                    <div className="project-name">{p.name}</div>
                                    <div className="project-desc">
                                        {p.description || "Aucune description"}
                                    </div>

                                    <div className="project-footer">
                                        <span className="project-meta">
                                            <i className="ti ti-calendar" /> {p.startDate || "N/A"}
                                        </span>
                                        <span className="project-meta">
                                            <i className="ti ti-flag" /> {p.endDate || "N/A"}
                                        </span>
                                    </div>
                                    <div className="dash-progress-wrap" style={{ marginTop: 12 }}>
                                        <div className="dash-progress-header">
                                            <span className="dash-progress-label">Avancement sprint</span>
                                            <span className="dash-progress-pct">{projectMetrics[p.id]?.progress ?? 0}%</span>
                                        </div>
                                        <div className="dash-progress-track">
                                            <div
                                                className="dash-progress-fill"
                                                style={{ width: `${projectMetrics[p.id]?.progress ?? 0}%` }}
                                            />
                                        </div>
                                        <div className="dash-stat-sub" style={{ marginTop: 6 }}>
                                            {projectMetrics[p.id]?.sprintCount ?? 0} sprint(s)
                                        </div>
                                    </div>

                                    {canCreateProject && (
                                        <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                className="dash-btn-outline"
                                                onClick={() => openEdit(p)}
                                            >
                                                <i className="ti ti-edit" aria-hidden="true" /> Modifier le projet
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {showModal && canCreateProject && (
                        <div className="modal-overlay" onClick={() => setShowModal(false)}>
                            <div className="modal-card" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3 className="modal-title">Nouveau projet</h3>
                                    <button className="modal-close" onClick={() => setShowModal(false)}>
                                        <i className="ti ti-x" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreate} className="modal-form">
                                    <div className="auth-field">
                                        <label className="auth-label">Nom du projet</label>
                                        <input
                                            className="auth-input"
                                            placeholder="ex: ScrumFlow Backend"
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">Description</label>
                                        <textarea
                                            className="auth-input"
                                            rows={3}
                                            placeholder="Décrivez le projet…"
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">Date de début</label>
                                        <input
                                            className="auth-input"
                                            type="date"
                                            value={form.startDate}
                                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">Date de fin</label>
                                        <input
                                            className="auth-input"
                                            type="date"
                                            value={form.endDate}
                                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <p className="dash-subtitle" style={{ margin: "0 0 8px" }}>
                                        Le statut initial est défini par le serveur (PLANIFIE).
                                    </p>

                                    <button type="submit" className="auth-submit">
                                        Créer le projet <span className="auth-arrow">→</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {showEditModal && canCreateProject && editingProject && (
                        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingProject(null); }}>
                            <div className="modal-card" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3 className="modal-title">Modifier le projet</h3>
                                    <button type="button" className="modal-close" onClick={() => { setShowEditModal(false); setEditingProject(null); }}>
                                        <i className="ti ti-x" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdate} className="modal-form">
                                    <div className="auth-field">
                                        <label className="auth-label">Statut</label>
                                        <select
                                            className="auth-input"
                                            value={editForm.status}
                                            onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                                        >
                                            {PROJECT_STATUSES.map((st) => (
                                                <option key={st} value={st}>{statusLabel(st)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Nom du projet</label>
                                        <input
                                            className="auth-input"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Description</label>
                                        <textarea
                                            className="auth-input"
                                            rows={3}
                                            value={editForm.description}
                                            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                        />
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Date de début</label>
                                        <input
                                            className="auth-input"
                                            type="date"
                                            value={editForm.startDate}
                                            onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Date de fin</label>
                                        <input
                                            className="auth-input"
                                            type="date"
                                            value={editForm.endDate}
                                            onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="auth-submit">
                                        Enregistrer <span className="auth-arrow">→</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Projects;
