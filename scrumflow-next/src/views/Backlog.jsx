"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/useAuth";
import { featureService } from "@/services/featureService";
import { projectService } from "@/services/projectService";

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const priorityColor = (p) => ({ HIGH: "red", MEDIUM: "amber", LOW: "blue" }[p] || "gray");
const priorityLabel = (p) => ({ HIGH: "Haute", MEDIUM: "Moyenne", LOW: "Basse" }[p] || p);

function Backlog() {
    const { user } = useAuth();
    const canCreateBacklog = user?.role === "PRODUCT_OWNER";
    const [searchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [featuresByProject, setFeaturesByProject] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalProjectId, setModalProjectId] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" });

    const projectIdFromUrl = searchParams.get("project");

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const projectsData = await projectService.getAll();
            setProjects(projectsData);

            const entries = await Promise.all(
                projectsData.map(async (p) => {
                    try {
                        const features = await featureService.getByProject(p.id);
                        return [p.id, features];
                    } catch {
                        return [p.id, []];
                    }
                })
            );
            setFeaturesByProject(Object.fromEntries(entries));
        } catch (error) {
            console.error("Erreur chargement backlog :", error);
            setProjects([]);
            setFeaturesByProject({});
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const openCreateModal = (projectId) => {
        setModalProjectId(projectId);
        setForm({ title: "", description: "", priority: "MEDIUM" });
        setShowModal(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!modalProjectId) return;

        try {
            const created = await featureService.create({
                ...form,
                projectId: Number(modalProjectId),
            });
            setFeaturesByProject((prev) => ({
                ...prev,
                [modalProjectId]: [created, ...(prev[modalProjectId] || [])],
            }));
            setShowModal(false);
            setModalProjectId(null);
            setForm({ title: "", description: "", priority: "MEDIUM" });
        } catch (error) {
            console.error("Erreur création feature :", error);
        }
    };

    const storiesPassPriority = (items) => (filter === "ALL" ? items : items.filter((i) => i.priority === filter));

    const searchNorm = search.toLowerCase().trim();

    const projectMatchesSearch = (project) => {
        if (!searchNorm) return true;
        if (project.name?.toLowerCase().includes(searchNorm)) return true;
        const stories = featuresByProject[project.id] || [];
        return stories.some(
            (s) =>
                s.title?.toLowerCase().includes(searchNorm) ||
                (s.description && s.description.toLowerCase().includes(searchNorm))
        );
    };

    const filterStoriesInProject = (projectId) => {
        const raw = featuresByProject[projectId] || [];
        const byPriority = storiesPassPriority(raw);
        if (!searchNorm) return byPriority;
        return byPriority.filter(
            (s) =>
                s.title?.toLowerCase().includes(searchNorm) ||
                (s.description && s.description.toLowerCase().includes(searchNorm))
        );
    };

    const orderedProjects = useMemo(() => {
        const list = [...projects];
        if (projectIdFromUrl) {
            const idNum = Number(projectIdFromUrl);
            const idx = list.findIndex((p) => p.id === idNum);
            if (idx > 0) {
                const [picked] = list.splice(idx, 1);
                list.unshift(picked);
            }
        }
        return list;
    }, [projects, projectIdFromUrl]);

    const visibleProjects = orderedProjects.filter(projectMatchesSearch);

    const focusProjectId = projectIdFromUrl ? Number(projectIdFromUrl) : null;

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Navbar
                    pageTitle="Backlog"
                    breadcrumb="ScrumFlow · Backlog"
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Filtrer par projet ou user story…"
                />
                <div className="page-content">

                    <div className="dash-header">
                        <div>
                            <h2 className="dash-title">Backlog</h2>
                            <span className="dash-subtitle">
                                {projects.length} projet{projects.length !== 1 ? "s" : ""}
                                {" · "}
                                {Object.values(featuresByProject).flat().length} user stor
                                {Object.values(featuresByProject).flat().length !== 1 ? "ies" : "y"}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <div className="filter-tabs">
                                {["ALL", ...PRIORITIES].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`filter-tab ${filter === p ? "active" : ""}`}
                                        onClick={() => setFilter(p)}
                                    >
                                        {p === "ALL" ? "Tout" : priorityLabel(p)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                    ) : projects.length === 0 ? (
                        <div className="page-empty">
                            <i className="ti ti-list-check" style={{ fontSize: 36, color: "#cbd5e1" }} aria-hidden="true" />
                            <p>Aucun projet</p>
                        </div>
                    ) : visibleProjects.length === 0 ? (
                        <div className="page-empty">
                            <i className="ti ti-list-check" style={{ fontSize: 36, color: "#cbd5e1" }} aria-hidden="true" />
                            <p>Aucun résultat pour cette recherche</p>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {visibleProjects.map((project) => {
                                const filteredStories = filterStoriesInProject(project.id);
                                const isFocus = focusProjectId && project.id === focusProjectId;
                                return (
                                    <div
                                        key={project.id}
                                        className="project-card"
                                        style={isFocus ? { boxShadow: "0 0 0 2px #3b82f6" } : undefined}
                                    >
                                        <div className="project-card-top">
                                            <div className="project-icon">
                                                {project.name?.[0]?.toUpperCase() ?? "P"}
                                            </div>
                                        </div>
                                        <div className="project-name">{project.name}</div>
                                        <div className="project-desc" style={{ marginBottom: 12 }}>
                                            {filteredStories.length} stor{filteredStories.length !== 1 ? "ies" : "y"} affichée{filteredStories.length !== 1 ? "s" : ""}
                                        </div>

                                        {canCreateBacklog && (
                                            <button
                                                type="button"
                                                className="dash-btn-outline primary"
                                                style={{ marginBottom: 12, width: "100%" }}
                                                onClick={() => openCreateModal(project.id)}
                                            >
                                                <i className="ti ti-plus" aria-hidden="true" /> Ajouter une user story
                                            </button>
                                        )}

                                        <div className="backlog-list">
                                            {filteredStories.length === 0 ? (
                                                <div className="page-empty" style={{ padding: "16px 0" }}>
                                                    <p className="dash-subtitle">Aucune user story pour ces filtres</p>
                                                </div>
                                            ) : (
                                                filteredStories.map((item, i) => (
                                                    <div key={item.id} className="backlog-row">
                                                        <span className="backlog-num">#{String(i + 1).padStart(3, "0")}</span>
                                                        <div className="backlog-info">
                                                            <span className="backlog-title">{item.title}</span>
                                                            {item.description && <span className="backlog-desc">{item.description}</span>}
                                                        </div>
                                                        <span className={`status-badge status-${priorityColor(item.priority)}`}>{priorityLabel(item.priority)}</span>
                                                        <span className={`status-badge status-${item.status === "DONE" ? "green" : "blue"}`}>
                                                            {item.status || "TODO"}
                                                        </span>
                                                        <span className={`backlog-status-tag ${item.status === "DONE" ? "in-sprint" : ""}`}>
                                                            {item.status === "DONE" ? "Terminée" : "À planifier"}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {showModal && canCreateBacklog && modalProjectId && (
                        <div className="modal-overlay" onClick={() => { setShowModal(false); setModalProjectId(null); }}>
                            <div className="modal-card" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3 className="modal-title">Nouvelle user story</h3>
                                    <button type="button" className="modal-close" onClick={() => { setShowModal(false); setModalProjectId(null); }}><i className="ti ti-x" aria-hidden="true" /></button>
                                </div>
                                <form onSubmit={handleCreate} className="modal-form">
                                    <p className="dash-subtitle">
                                        Projet : {projects.find((p) => p.id === modalProjectId)?.name || `#${modalProjectId}`}
                                    </p>
                                    <div className="auth-field">
                                        <label className="auth-label">Titre</label>
                                        <input className="auth-input" placeholder="En tant que… je veux…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Description</label>
                                        <textarea className="auth-input" rows={3} placeholder="Critères d'acceptation…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
                                    <button type="submit" className="auth-submit">Ajouter au backlog <span className="auth-arrow">→</span></button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Backlog;
