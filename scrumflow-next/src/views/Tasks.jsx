"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/useAuth";
import { taskService } from "@/services/taskService";
import { featureService } from "@/services/featureService";
import { projectService } from "@/services/projectService";
import { projectMemberService } from "@/services/projectMemberService";
import { asArray } from "@/utils/apiNormalize";
import { developersFromProjectMembersApi } from "@/utils/projectMemberNormalize";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const statusColor = (s) => ({ TODO: "gray", IN_PROGRESS: "blue", DONE: "green" }[s] || "gray");
const statusLabel = (s) => ({ TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminé" }[s] || s);
const priorityColor = (p) => ({ HIGH: "red", MEDIUM: "amber", LOW: "blue" }[p] || "gray");
const priorityLabel = (p) => ({ HIGH: "Haute", MEDIUM: "Moyenne", LOW: "Basse" }[p] || p);

function resolveTaskProjectId(task, featureMap) {
    if (task?.projectId != null) return Number(task.projectId);
    const fid = task?.featureId ?? task?.feature?.id;
    if (fid != null && featureMap[fid] != null) {
        return Number(featureMap[fid]);
    }
    return null;
}

function Tasks() {
    const { user } = useAuth();
    const isScrumMaster = user?.role === "SCRUM_MASTER";
    const isDeveloper = user?.role === "DEVELOPER";
    const canChangeTaskStatus = isDeveloper;

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [features, setFeatures] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [showModal, setShowModal] = useState(false);
    const [developers, setDevelopers] = useState([]);
    const [featureProjectByFeatureId, setFeatureProjectByFeatureId] = useState({});
    const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", featureId: "", assigneeUserId: "" });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [projectsData, tasksData] = await Promise.all([
                    projectService.getAll(),
                    isDeveloper ? taskService.getByDeveloper(user?.userId) : taskService.getAll(),
                ]);

                setProjects(projectsData);
                if (projectsData.length > 0) {
                    setSelectedProjectId(String(projectsData[0].id));
                }

                const featureMap = {};
                await Promise.all(
                    projectsData.map(async (p) => {
                        try {
                            const feats = await featureService.getByProject(p.id);
                            feats.forEach((f) => {
                                featureMap[f.id] = p.id;
                            });
                        } catch {
                            /* ignore */
                        }
                    })
                );
                setFeatureProjectByFeatureId(featureMap);

                setTasks(asArray(tasksData));
            } catch (error) {
                console.error("Erreur chargement tâches :", error);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };

        if (user?.userId) {
            loadData();
        }
    }, [isDeveloper, user?.userId]);

    useEffect(() => {
        if (!selectedProjectId) {
            setFeatures([]);
            setDevelopers([]);
            return;
        }

        const loadProjectData = async () => {
            try {
                const [featuresData, membersData] = await Promise.all([
                    featureService.getByProject(selectedProjectId),
                    projectMemberService.getByProject(selectedProjectId),
                ]);

                const feats = asArray(featuresData);
                setFeatures(feats);
                const projectDevelopers = developersFromProjectMembersApi(membersData);
                setDevelopers(projectDevelopers);

                setForm((prev) => ({
                    ...prev,
                    featureId: feats[0]?.id ? String(feats[0].id) : "",
                    assigneeUserId: projectDevelopers[0]?.id ? String(projectDevelopers[0].id) : "",
                }));
            } catch (error) {
                console.error("Erreur chargement données projet :", error);
                setFeatures([]);
                setDevelopers([]);
                setForm((prev) => ({ ...prev, featureId: "" }));
            }
        };

        loadProjectData();
    }, [selectedProjectId]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!form.featureId) {
            return;
        }

        try {
            const created = await taskService.create({
                title: form.title,
                description: form.description,
                priority: form.priority,
                featureId: Number(form.featureId),
            });
            const assignedTask = form.assigneeUserId
                ? await taskService.assignToUser(created.id, Number(form.assigneeUserId))
                : created;
            setTasks(prev => [assignedTask, ...prev]);
            setShowModal(false);
            setForm((prev) => ({ ...prev, title: "", description: "", priority: "MEDIUM" }));
        } catch (error) {
            console.error("Erreur création tâche :", error);
        }
    };

    const handleStatusChange = async (taskId, status) => {
        try {
            const updated = await taskService.changeStatus(taskId, status);
            setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
        } catch (error) {
            console.error("Erreur changement statut tâche :", error);
        }
    };

    const developerNameById = (userId) => {
        const userMatch = developers.find((developer) => developer.id === userId);
        return userMatch?.fullName ?? null;
    };

    const searchNorm = search.toLowerCase().trim();

    const tasksOnProject = useMemo(() => {
        if (!selectedProjectId) return tasks;
        const pid = Number(selectedProjectId);
        return tasks.filter((t) => resolveTaskProjectId(t, featureProjectByFeatureId) === pid);
    }, [tasks, selectedProjectId, featureProjectByFeatureId]);

    const projectNameForTask = (task) =>
        projects.find((p) => p.id === resolveTaskProjectId(task, featureProjectByFeatureId))?.name ?? "";

    const filtered = (filterStatus === "ALL" ? tasksOnProject : tasksOnProject.filter(t => t.status === filterStatus))
        .filter((task) => {
            if (!searchNorm) return true;
            const pname = projectNameForTask(task).toLowerCase();
            return (
                task.title?.toLowerCase().includes(searchNorm) ||
                (task.description && task.description.toLowerCase().includes(searchNorm)) ||
                pname.includes(searchNorm) ||
                String(task.assignedTo ?? "").includes(searchNorm)
            );
        });

    const countBy = (s) => tasksOnProject.filter(t => t.status === s).length;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Navbar
                    pageTitle="Tasks"
                    breadcrumb="ScrumFlow · Tasks"
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Tâche, projet, assignation…"
                />
                <div className="page-content">

                    <div className="dash-header">
                        <div>
                            <h2 className="dash-title">
                                Tâches — {projects.find((p) => String(p.id) === String(selectedProjectId))?.name || "Projet"}
                            </h2>
                            <span className="dash-subtitle">{filtered.length} tâche{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <select
                                className="auth-input"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                style={{ width: 220, height: 36 }}
                            >
                                {projects.length === 0 && <option value="">Aucun projet</option>}
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            {isScrumMaster && (
                                <button type="button" className="dash-btn-outline primary" onClick={() => setShowModal(true)}>
                                    <i className="ti ti-plus" aria-hidden="true" /> Nouvelle tâche
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mini stat row */}
                    <div className="tasks-stats">
                        {STATUSES.map(s => (
                            <div key={s} className="task-stat-pill" onClick={() => setFilterStatus(s === filterStatus ? "ALL" : s)} style={{ cursor: "pointer" }}>
                                <span className={`sdot-lg dot-${statusColor(s)}`} />
                                <span className="task-stat-label">{statusLabel(s)}</span>
                                <span className="task-stat-count">{countBy(s)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Filter tabs */}
                    <div className="filter-tabs" style={{ marginBottom: 0 }}>
                        {["ALL", ...STATUSES].map(s => (
                            <button key={s} className={`filter-tab ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>
                                {s === "ALL" ? "Tout" : statusLabel(s)}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                    ) : (
                        <div className="backlog-list">
                            {filtered.length === 0 && <div className="page-empty"><i className="ti ti-checkbox" style={{ fontSize: 36, color: "#cbd5e1" }} aria-hidden="true" /><p>Aucune tâche</p></div>}
                            {filtered.map(task => (
                                <div key={task.id} className="backlog-row">
                                    <div className={`task-status-dot dot-${statusColor(task.status)}`} title={statusLabel(task.status)} />
                                    <div className="backlog-info">
                                        <span className="backlog-title" style={{ textDecoration: task.status === "DONE" ? "line-through" : "none", opacity: task.status === "DONE" ? 0.5 : 1 }}>{task.title}</span>
                                        {task.description && <span className="backlog-desc">{task.description}</span>}
                                    </div>
                                    <span className="dash-subtitle">
                                        Assignée à: {developerNameById(task.assignedTo) || (task.assignedTo ? `User #${task.assignedTo}` : "Non assignée")}
                                    </span>
                                    <span className={`status-badge status-${priorityColor(task.priority)}`}>{priorityLabel(task.priority)}</span>
                                    {canChangeTaskStatus ? (
                                        <select
                                            className={`status-badge status-${statusColor(task.status)}`}
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            style={{ border: "none", cursor: "pointer" }}
                                        >
                                            <option value="TODO">À faire</option>
                                            <option value="IN_PROGRESS">En cours</option>
                                            <option value="DONE">Terminé</option>
                                        </select>
                                    ) : (
                                        <span className={`status-badge status-${statusColor(task.status)}`}>
                                            {statusLabel(task.status)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {showModal && (
                        <div className="modal-overlay" onClick={() => setShowModal(false)}>
                            <div className="modal-card" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3 className="modal-title">Nouvelle tâche</h3>
                                    <button className="modal-close" onClick={() => setShowModal(false)}><i className="ti ti-x" aria-hidden="true" /></button>
                                </div>
                                <form onSubmit={handleCreate} className="modal-form">
                                    <div className="auth-field">
                                        <label className="auth-label">Titre</label>
                                        <input className="auth-input" placeholder="ex: Implémenter le endpoint…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Description</label>
                                        <textarea className="auth-input" rows={2} placeholder="Détails de la tâche…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div className="auth-field">
                                            <label className="auth-label">Priorité</label>
                                            <select className="auth-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                                                <option value="HIGH">Haute</option>
                                                <option value="MEDIUM">Moyenne</option>
                                                <option value="LOW">Basse</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Projet</label>
                                        <select
                                            className="auth-input"
                                            value={selectedProjectId}
                                            onChange={(e) => setSelectedProjectId(e.target.value)}
                                        >
                                            {projects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Feature (User Story)</label>
                                        <select
                                            className="auth-input"
                                            value={form.featureId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, featureId: e.target.value }))}
                                            required
                                        >
                                            {features.length === 0 && <option value="">Aucune feature</option>}
                                            {features.map((feature) => (
                                                <option key={feature.id} value={feature.id}>
                                                    {feature.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Développeur assigné</label>
                                        <select
                                            className="auth-input"
                                            value={form.assigneeUserId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, assigneeUserId: e.target.value }))}
                                        >
                                            <option value="">Non assignée</option>
                                            {developers.map((developer) => (
                                                <option key={developer.id} value={developer.id}>
                                                    {developer.fullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="submit" className="auth-submit">Créer la tâche <span className="auth-arrow">→</span></button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Tasks;