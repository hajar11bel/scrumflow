"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { projectService } from "@/services/projectService";
import { sprintService } from "@/services/sprintService";
import { taskService } from "@/services/taskService";

const statusColor = (s) => ({ ACTIVE: "blue", COMPLETED: "green", PLANNED: "amber" }[s] || "gray");
const statusLabel = (s) => ({ ACTIVE: "En cours", COMPLETED: "Terminé", PLANNED: "Planifié" }[s] || s);

function Sprints() {
    const [searchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [sprints, setSprints] = useState([]);
    const [progressBySprint, setProgressBySprint] = useState({});
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [sprintsLoading, setSprintsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
    const [showGlobalSprints, setShowGlobalSprints] = useState(false);
    const [globalRows, setGlobalRows] = useState([]);
    const [globalLoading, setGlobalLoading] = useState(false);

    useEffect(() => {
        const loadProjects = async () => {
            setProjectsLoading(true);
            try {
                const data = await projectService.getAll();
                setProjects(data);
                const param = searchParams.get("project");
                if (param && data.some((p) => String(p.id) === String(param))) {
                    setSelectedProjectId(String(param));
                } else if (data.length > 0) {
                    setSelectedProjectId(String(data[0].id));
                }
            } catch (error) {
                console.error("Erreur chargement projets :", error);
            } finally {
                setProjectsLoading(false);
            }
        };

        loadProjects();
    }, [searchParams]);

    useEffect(() => {
        if (!selectedProjectId) {
            setSprints([]);
            return;
        }

        const loadSprints = async () => {
            setSprintsLoading(true);
            try {
                const data = await sprintService.getByProject(selectedProjectId);
                setSprints(data);

                const progressEntries = await Promise.all(
                    data.map(async (sprint) => {
                        try {
                            const tasks = await taskService.getBySprint(sprint.id);
                            const done = tasks.filter((task) => task.status === "DONE").length;
                            const progress = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
                            return [sprint.id, progress];
                        } catch {
                            return [sprint.id, 0];
                        }
                    })
                );

                setProgressBySprint(Object.fromEntries(progressEntries));
            } catch (error) {
                console.error("Erreur chargement sprints :", error);
                setSprints([]);
                setProgressBySprint({});
            } finally {
                setSprintsLoading(false);
            }
        };

        loadSprints();
    }, [selectedProjectId]);

    useEffect(() => {
        if (!showGlobalSprints) {
            setGlobalRows([]);
            return;
        }

        const loadAll = async () => {
            setGlobalLoading(true);
            try {
                const projs = await projectService.getAll();
                const rows = [];
                for (const p of projs) {
                    try {
                        const list = await sprintService.getByProject(p.id);
                        list.forEach((s) => {
                            rows.push({ ...s, projectName: p.name, projectId: p.id });
                        });
                    } catch {
                        /* ignore */
                    }
                }
                setGlobalRows(rows);
            } catch (e) {
                console.error("Vue globale sprints :", e);
                setGlobalRows([]);
            } finally {
                setGlobalLoading(false);
            }
        };

        loadAll();
    }, [showGlobalSprints]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!selectedProjectId) {
            return;
        }

        try {
            const created = await sprintService.create({
                ...form,
                projectId: Number(selectedProjectId),
            });
            setSprints(prev => [created, ...prev]);
            setShowModal(false);
            setForm({ name: "", startDate: "", endDate: "" });
        } catch (error) {
            console.error("Erreur création sprint :", error);
        }
    };

    const searchNorm = search.toLowerCase().trim();
    const sprintMatches = (s, projectName = "") => {
        if (!searchNorm) return true;
        return (
            s.name?.toLowerCase().includes(searchNorm) ||
            (s.goal && s.goal.toLowerCase().includes(searchNorm)) ||
            String(s.startDate || "").includes(searchNorm) ||
            String(s.endDate || "").includes(searchNorm) ||
            projectName.toLowerCase().includes(searchNorm)
        );
    };

    const filteredSprints = sprints.filter((s) => sprintMatches(s));
    const activeSprint = filteredSprints.find(s => s.status === "ACTIVE");
    const otherSprints = filteredSprints.filter(s => s.status !== "ACTIVE");

    const filteredGlobal = globalRows.filter((row) => sprintMatches(row, row.projectName || ""));

    const progressPct = (s) => {
        return progressBySprint[s.id] ?? 0;
    };

    const handleChangeStatus = async (sprintId, status) => {
        try {
            const updated = await sprintService.changeStatus(sprintId, status);
            setSprints((prev) => prev.map((sprint) => (sprint.id === sprintId ? updated : sprint)));
            setGlobalRows((prev) => prev.map((row) => (row.id === sprintId ? { ...row, ...updated } : row)));
        } catch (error) {
            console.error("Erreur changement statut sprint :", error);
        }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Navbar
                    pageTitle="Sprints"
                    breadcrumb="ScrumFlow · Sprints"
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Filtrer les sprints (nom, dates, projet)…"
                />
                <div className="page-content">

                    <div className="dash-header">
                        <div>
                            <h2 className="dash-title">Sprints</h2>
                            <span className="dash-subtitle">
                                {showGlobalSprints
                                    ? `${filteredGlobal.length} sprint${filteredGlobal.length !== 1 ? "s" : ""} (tous projets)`
                                    : `${filteredSprints.length} sprint${filteredSprints.length !== 1 ? "s" : ""} sur le projet sélectionné`}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <select
                                className="auth-input"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                style={{ width: 220, height: 36 }}
                                disabled={projectsLoading || projects.length === 0}
                            >
                                {projects.length === 0 && <option value="">Aucun projet</option>}
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="dash-btn-outline primary" onClick={() => setShowModal(true)}>
                                <i className="ti ti-plus" aria-hidden="true" /> Nouveau sprint
                            </button>
                            <button
                                type="button"
                                className={`dash-btn-outline ${showGlobalSprints ? "primary" : ""}`}
                                onClick={() => setShowGlobalSprints((v) => !v)}
                            >
                                {showGlobalSprints ? "Vue par projet" : "Tous les sprints (tous projets)"}
                            </button>
                        </div>
                    </div>

                    {projectsLoading ? (
                        <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                    ) : showGlobalSprints ? (
                        <>
                            <p className="dash-subtitle" style={{ marginBottom: 12 }}>
                                Vue globale : tous les sprints, avec le projet d’origine. Utilisez le sélecteur de projet pour en créer un nouveau sur un projet précis.
                            </p>
                            {globalLoading ? (
                                <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                            ) : filteredGlobal.length === 0 ? (
                                <div className="page-empty">
                                    <i className="ti ti-player-play" style={{ fontSize: 40, color: "#cbd5e1" }} aria-hidden="true" />
                                    <p>{globalRows.length === 0 ? "Aucun sprint" : "Aucun sprint ne correspond à la recherche"}</p>
                                </div>
                            ) : (
                                <div className="backlog-list">
                                    {filteredGlobal.map((s) => (
                                        <div key={`${s.projectId}-${s.id}`} className="backlog-row">
                                            <div className="backlog-info">
                                                <span className="backlog-title">{s.name}</span>
                                                <span className="backlog-desc">Projet : {s.projectName}</span>
                                                {s.goal && <span className="backlog-desc">{s.goal}</span>}
                                            </div>
                                            <span className="dash-subtitle" style={{ fontSize: 12 }}>
                                                <i className="ti ti-calendar" aria-hidden="true" style={{ marginRight: 4 }} />
                                                {s.startDate} → {s.endDate}
                                            </span>
                                            <span className={`status-badge status-${statusColor(s.status)}`}>{statusLabel(s.status)}</span>
                                            <button
                                                type="button"
                                                className="dash-btn-outline"
                                                onClick={() => {
                                                    setSelectedProjectId(String(s.projectId));
                                                    setShowGlobalSprints(false);
                                                }}
                                            >
                                                Ouvrir ce projet
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : sprintsLoading ? (
                        <div className="page-loading"><span className="auth-spinner" style={{ borderTopColor: "#2563eb", borderColor: "rgba(37,99,235,0.2)" }} /></div>
                    ) : (
                        <>
                            {activeSprint && (
                                <div className="sprint-active-card">
                                    <div className="sprint-active-header">
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                                <span className="sprint-live-pill" style={{ fontSize: 11 }}><span className="sprint-pip" />En cours</span>
                                                <span className="sprint-name">{activeSprint.name}</span>
                                            </div>
                                            <span className="dash-subtitle">Sprint actif du projet sélectionné</span>
                                        </div>
                                        <div className="sprint-active-dates">
                                            <i className="ti ti-calendar" aria-hidden="true" />
                                            {activeSprint.startDate} → {activeSprint.endDate}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 14 }}>
                                        <div className="dash-progress-header">
                                            <span className="dash-progress-label">Avancement</span>
                                            <span className="dash-progress-pct">{progressPct(activeSprint)}%</span>
                                        </div>
                                        <div className="dash-progress-track">
                                            <div className="dash-progress-fill" style={{ width: `${progressPct(activeSprint)}%` }} />
                                        </div>
                                        <div className="sprint-pts-row">
                                            <span>{progressPct(activeSprint)}% terminé</span>
                                            <span>{100 - progressPct(activeSprint)}% restant</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {otherSprints.length > 0 && (
                                <div className="backlog-list">
                                    {otherSprints.map(s => (
                                        <div key={s.id} className="backlog-row">
                                            <div className="backlog-info">
                                                <span className="backlog-title">{s.name}</span>
                                                {s.goal && <span className="backlog-desc">{s.goal}</span>}
                                            </div>
                                            <span className="dash-subtitle" style={{ fontSize: 12 }}>
                                                <i className="ti ti-calendar" aria-hidden="true" style={{ marginRight: 4 }} />
                                                {s.startDate} → {s.endDate}
                                            </span>
                                            <span className={`status-badge status-${statusColor(s.status)}`}>{statusLabel(s.status)}</span>
                                            <span className="backlog-pts">{progressPct(s)}%</span>
                                            <select
                                                className="auth-input"
                                                style={{ width: 140, height: 32 }}
                                                value={s.status}
                                                onChange={(e) => handleChangeStatus(s.id, e.target.value)}
                                            >
                                                <option value="PLANNED">Planifié</option>
                                                <option value="ACTIVE">Actif</option>
                                                <option value="COMPLETED">Terminé</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {filteredSprints.length === 0 && (
                                <div className="page-empty">
                                    <i className="ti ti-player-play" style={{ fontSize: 40, color: "#cbd5e1" }} aria-hidden="true" />
                                    <p>{sprints.length === 0 ? "Aucun sprint créé" : "Aucun sprint ne correspond à la recherche"}</p>
                                    {sprints.length === 0 && (
                                        <button type="button" className="dash-btn-outline primary" onClick={() => setShowModal(true)}>Créer votre premier sprint</button>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {showModal && (
                        <div className="modal-overlay" onClick={() => setShowModal(false)}>
                            <div className="modal-card" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3 className="modal-title">Nouveau sprint</h3>
                                    <button type="button" className="modal-close" onClick={() => setShowModal(false)}><i className="ti ti-x" aria-hidden="true" /></button>
                                </div>
                                <form onSubmit={handleCreate} className="modal-form">
                                    <p className="dash-subtitle">
                                        Projet cible : {projects.find((p) => String(p.id) === String(selectedProjectId))?.name || `#${selectedProjectId}`}
                                    </p>
                                    <div className="auth-field">
                                        <label className="auth-label">Nom</label>
                                        <input className="auth-input" placeholder="ex: Sprint 15" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div className="auth-field">
                                            <label className="auth-label">Début</label>
                                            <input className="auth-input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
                                        </div>
                                        <div className="auth-field">
                                            <label className="auth-label">Fin</label>
                                            <input className="auth-input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
                                        </div>
                                    </div>
                                    <button type="submit" className="auth-submit">Créer le sprint <span className="auth-arrow">→</span></button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Sprints;
