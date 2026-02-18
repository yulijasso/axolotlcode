"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { getSessions, createSession, deleteSession, renameSession } from "../../lib/sessions.js";
import s from "./sessions.module.css";

const LANG_COLORS = {
    "c++": "#bd93f9",
    "c (": "#bd93f9",
    python: "#64ffda",
    javascript: "#f1fa8c",
    typescript: "#79b8ff",
    java: "#ffb86c",
    rust: "#ff79c6",
    go: "#50fa7b",
    ruby: "#ff5555",
    "c#": "#79b8ff",
    php: "#bd93f9",
    kotlin: "#ffb86c",
    swift: "#ff79c6",
};

function getLangBadge(name = "") {
    const n = name.toLowerCase();
    if (n.includes("c++")) return "C++";
    if (n.includes("python")) return "PY";
    if (n.includes("javascript")) return "JS";
    if (n.includes("typescript")) return "TS";
    if (n.startsWith("java")) return "JV";
    if (n.includes("rust")) return "RS";
    if (n.startsWith("go ") || n === "go") return "GO";
    if (n.includes("ruby")) return "RB";
    if (n.includes("c#")) return "C#";
    if (n.includes("c (")) return "C";
    if (n.includes("php")) return "PHP";
    if (n.includes("kotlin")) return "KT";
    if (n.includes("swift")) return "SW";
    return name.slice(0, 3).toUpperCase();
}

function getLangColor(name = "") {
    const n = name.toLowerCase();
    for (const [key, color] of Object.entries(LANG_COLORS)) {
        if (n.includes(key)) return color;
    }
    return "#555";
}

function timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return "just now";
    const m = Math.floor(sec / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
}

export default function SessionsPage() {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useUser();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isLoaded) return;
        async function load() {
            if (isSignedIn) {
                try {
                    const res = await fetch("/api/sessions");
                    if (res.ok) setSessions(await res.json());
                } catch { setSessions([]); }
            } else {
                setSessions(getSessions());
            }
            setLoading(false);
        }
        load();
    }, [isSignedIn, isLoaded]);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    async function handleNew() {
        if (isSignedIn) {
            const res = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Untitled Session" }),
            });
            const session = await res.json();
            router.push(`/ide?session=${session.id}`);
        } else {
            const session = createSession();
            router.push(`/ide?session=${session.id}`);
        }
    }

    function handleOpen(id) {
        router.push(`/ide?session=${id}`);
    }

    async function handleDelete(e, id) {
        e.stopPropagation();
        if (isSignedIn) {
            await fetch(`/api/sessions/${id}`, { method: "DELETE" });
        } else {
            deleteSession(id);
        }
        setSessions((prev) => prev.filter((s) => s.id !== id));
    }

    function handleRenameStart(e, session) {
        e.stopPropagation();
        setEditingId(session.id);
        setEditName(session.name);
    }

    async function handleRenameCommit(id) {
        const name = editName.trim();
        if (name) {
            if (isSignedIn) {
                await fetch(`/api/sessions/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                });
            } else {
                renameSession(id, name);
            }
            setSessions((prev) => prev.map((s) => s.id === id ? { ...s, name } : s));
        }
        setEditingId(null);
    }

    function handleRenameKey(e, id) {
        if (e.key === "Enter") handleRenameCommit(id);
        if (e.key === "Escape") setEditingId(null);
    }

    return (
        <div className={s.page}>
            <nav className={s.nav}>
                <Link href="/" className={s.navBrand}>
                    <img src="/images/axolotlcode.png" alt="Axolotl Code" className={s.navLogo} />
                    <span className={s.navTitle}>Axolotl Code</span>
                </Link>
                <div className={s.navRight}>
                    <Link href="/ide" className={s.navLink}>Editor</Link>
                    <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button style={{ fontFamily: "inherit", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", background: "transparent", border: "1px solid #1e1e1e", padding: "0.4rem 0.9rem", cursor: "pointer" }}>
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </nav>

            <div className={s.container}>
                <div className={s.header}>
                    <p className={s.headerTitle}><span>── sessions ──</span></p>
                    <button className={s.newBtn} onClick={handleNew}>+ New Session</button>
                </div>

                {!isLoaded || loading ? (
                    <div className={s.empty}>
                        <p className={s.emptyPrompt}><span>$</span> loading...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className={s.empty}>
                        <p className={s.emptyPrompt}>
                            <span>$</span> no sessions found.{" "}
                            {!isSignedIn && <span style={{ color: "#555" }}>sign in to sync across devices.</span>}
                        </p>
                        <button className={s.emptyBtn} onClick={handleNew}>+ New Session</button>
                    </div>
                ) : (
                    <div className={s.list}>
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={s.item}
                                onClick={() => editingId !== session.id && handleOpen(session.id)}
                            >
                                <span
                                    className={s.badge}
                                    style={{
                                        background: getLangColor(session.languageName) + "22",
                                        color: getLangColor(session.languageName),
                                        border: `1px solid ${getLangColor(session.languageName)}44`,
                                    }}
                                >
                                    {getLangBadge(session.languageName)}
                                </span>

                                <div className={s.itemMain}>
                                    {editingId === session.id ? (
                                        <input
                                            ref={inputRef}
                                            className={s.itemName}
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={() => handleRenameCommit(session.id)}
                                            onKeyDown={(e) => handleRenameKey(e, session.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div
                                            className={s.itemName}
                                            onDoubleClick={(e) => handleRenameStart(e, session)}
                                            title="Double-click to rename"
                                        >
                                            {session.name}
                                        </div>
                                    )}
                                    <div className={s.itemMeta}>{session.languageName || "—"}</div>
                                </div>

                                <span className={s.itemTime}>{timeAgo(session.updatedAt)}</span>

                                <button
                                    className={s.deleteBtn}
                                    onClick={(e) => handleDelete(e, session.id)}
                                    title="Delete session"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!isSignedIn && isLoaded && (
                    <p style={{ marginTop: "2rem", fontSize: "0.65rem", color: "#2a2a2a", letterSpacing: "0.08em", textAlign: "center" }}>
                        sessions are stored locally.{" "}
                        <SignInButton mode="modal">
                            <button style={{ background: "none", border: "none", color: "#ff79c6", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", letterSpacing: "inherit" }}>
                                sign in
                            </button>
                        </SignInButton>
                        {" "}to sync to the cloud.
                    </p>
                )}
            </div>
        </div>
    );
}
