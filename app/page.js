import Link from "next/link";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/nextjs";
import s from "./landing.module.css";
import LanguagePicker from "../components/LanguagePicker";

export default function LandingPage() {
    return (
        <div className={s.page}>

            {/* ── Nav ───────────────────────────────── */}
            <nav className={s.nav}>
                <Link href="/" className={s.navBrand}>
                    <img src="/images/axolotlcode.png" alt="Axolotl Code" className={s.navLogo} />
                    <span className={s.navTitle}>Axolotl Code</span>
                </Link>

                <div className={s.navRight}>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className={s.signInBtn}>Sign In</button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className={s.signUpBtn}>Sign Up</button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Link href="/sessions" className={s.signInBtn}>Sessions</Link>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                    <Link href="/ide" className={s.launchBtn}>
                        Launch Editor →
                    </Link>
                </div>
            </nav>

            {/* ── Hero ──────────────────────────────── */}
            <section className={s.hero}>
                <div className={s.heroLeft}>
                    <img src="/images/axolotlcode.png" alt="" className={s.heroLogo} />

                    <p className={s.heroTag}>
                        <span>▸</span> cloud-based code editor
                    </p>

                    <h1 className={s.heroTitle}>
                        Axolotl<span>.</span>
                    </h1>

                    <div className={s.heroDivider} />

                    <p className={s.heroSub}>
                        Write, run, and debug code in the cloud.<br />
                        <em>AI-powered suggestions.</em> Zero setup.<br />
                        50+ languages. Instant execution.
                    </p>

                    <p className={s.heroPrompt}>
                        <span>$</span> axolotl --start <span className={s.cursor} />
                    </p>
                </div>

                <div className={s.heroRight}>
                    <LanguagePicker />
                </div>
            </section>

            {/* ── Terminal strip ────────────────────── */}
            <div className={s.terminal}>
                <div className={s.terminalBar}>
                    <span className={s.dot} />
                    <span className={s.dot} />
                    <span className={s.dot} />
                    <span style={{ marginLeft: "0.5rem" }}>axolotl_code — bash</span>
                </div>
                <div className={s.terminalBody}>
                    <div><span className={s.tDim}>~</span> <span className={s.tPink}>$</span> axolotl run main.cpp</div>
                    <div><span className={s.tDim}>  ▸ compiling...</span></div>
                    <div><span className={s.tGreen}>  ✓ compiled in 0.3s</span></div>
                    <div><span className={s.tCyan}>  output: Hello, world!</span></div>
                    <div><span className={s.tDim}>  execution time: 12ms · memory: 4KB</span></div>
                    <div style={{ marginTop: "0.5rem" }}>
                        <span className={s.tDim}>~</span> <span className={s.tPink}>$</span>{" "}
                        <span className={s.cursor} />
                    </div>
                </div>
            </div>

            {/* ── Features ──────────────────────────── */}
            <section className={s.features}>
                <p className={s.featuresHeader}><span>── features ──</span></p>
                <div className={s.featuresGrid}>
                    <div className={s.card}>
                        <div className={s.cardBar} />
                        <h3 className={s.cardTitle}>AI Assistant</h3>
                        <p className={s.cardBody}>
                            Inline code suggestions as you type.<br />
                            Chat with AI to <em>explain, fix, or refactor</em>.<br />
                            Apply fixes with one click.
                        </p>
                        <span className={s.cardCorner}>01</span>
                    </div>
                    <div className={s.card}>
                        <div className={s.cardBar} />
                        <h3 className={s.cardTitle}>50+ Languages</h3>
                        <p className={s.cardBody}>
                            C++, Python, Rust, Go, Java, TypeScript.<br />
                            <em>Every language you need.</em><br />
                            Syntax highlighting & smart completion.
                        </p>
                        <span className={s.cardCorner}>02</span>
                    </div>
                    <div className={s.card}>
                        <div className={s.cardBar} />
                        <h3 className={s.cardTitle}>Cloud Execution</h3>
                        <p className={s.cardBody}>
                            Run code instantly in the cloud.<br />
                            No local setup. No dependencies.<br />
                            <em>Sub-second execution times.</em>
                        </p>
                        <span className={s.cardCorner}>03</span>
                    </div>
                </div>
            </section>

            {/* ── Footer ────────────────────────────── */}
            <footer className={s.footer}>
                <span>© 2025 AXOLOTL CODE</span>
                <span>
                    <Link href="/ide">editor</Link>
                    {" · "}
                    <a href="https://github.com/judge0/ide" target="_blank" rel="noreferrer">github</a>
                </span>
            </footer>

        </div>
    );
}
