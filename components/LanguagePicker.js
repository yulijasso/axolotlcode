"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "./LanguagePicker.module.css";

const FAVORITES = [
    { name: "Python",     ext: "py",    icon: "🐍" },
    { name: "C++",        ext: "cpp",   icon: "⚡" },
    { name: "JavaScript", ext: "js",    icon: "◈" },
    { name: "TypeScript", ext: "ts",    icon: "◈" },
];

const ALL_LANGUAGES = [
    { name: "Java",       ext: "java",  icon: "☕" },
    { name: "Rust",       ext: "rs",    icon: "⚙" },
    { name: "Go",         ext: "go",    icon: "◉" },
    { name: "C",          ext: "c",     icon: "©" },
    { name: "Ruby",       ext: "rb",    icon: "♦" },
    { name: "PHP",        ext: "php",   icon: "◇" },
    { name: "Bash",       ext: "sh",    icon: "$" },
    { name: "Swift",      ext: "swift", icon: "◆" },
    { name: "Scala",      ext: "scala", icon: "∑" },
    { name: "SQL",        ext: "txt",   icon: "⊞" },
    { name: "Assembly",   ext: "asm",   icon: "▦" },
    { name: "Pascal",     ext: "pas",   icon: "Π" },
];

export default function LanguagePicker() {
    const [selected, setSelected] = useState(FAVORITES[0]);
    const [query, setQuery] = useState("");
    const router = useRouter();

    const filtered = ALL_LANGUAGES.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase())
    );

    function handleStart() {
        router.push(`/ide?lang=${selected.ext}`);
    }

    return (
        <div className={s.panel}>
            {/* Panel title bar */}
            <div className={s.titleBar}>
                <span className={s.dot} /><span className={s.dot} /><span className={s.dot} />
                <span className={s.barTitle}>new_session.axl</span>
            </div>

            {/* Search */}
            <div className={s.searchRow}>
                <span className={s.searchIcon}>▸</span>
                <input
                    className={s.searchInput}
                    type="text"
                    placeholder="search language..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    spellCheck={false}
                />
            </div>

            <div className={s.listsWrap}>
                {/* Favorites */}
                {!query && (
                    <div className={s.section}>
                        <p className={s.sectionLabel}>// favorites</p>
                        {FAVORITES.map(lang => (
                            <button
                                key={lang.ext}
                                className={`${s.langRow} ${selected.ext === lang.ext ? s.active : ""}`}
                                onClick={() => setSelected(lang)}
                            >
                                <span className={s.langIcon}>{lang.icon}</span>
                                <span className={s.langName}>{lang.name}</span>
                                {selected.ext === lang.ext && <span className={s.check}>●</span>}
                            </button>
                        ))}
                    </div>
                )}

                {/* All / filtered */}
                <div className={s.section}>
                    <p className={s.sectionLabel}>{query ? `// results` : `// all languages`}</p>
                    {(query ? filtered : ALL_LANGUAGES).map(lang => (
                        <button
                            key={lang.ext}
                            className={`${s.langRow} ${selected.ext === lang.ext ? s.active : ""}`}
                            onClick={() => setSelected(lang)}
                        >
                            <span className={s.langIcon}>{lang.icon}</span>
                            <span className={s.langName}>{lang.name}</span>
                            {selected.ext === lang.ext && <span className={s.check}>●</span>}
                        </button>
                    ))}
                    {query && filtered.length === 0 && (
                        <p className={s.empty}>no results for "{query}"</p>
                    )}
                </div>
            </div>

            {/* CTA */}
            <div className={s.ctaRow}>
                <button className={s.ctaBtn} onClick={handleStart}>
                    Start coding in {selected.name} →
                </button>
            </div>
        </div>
    );
}
