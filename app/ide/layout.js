import Script from "next/script";

export const metadata = {
    title: "Axolotl Code — Editor",
};

export default function IDELayout({ children }) {
    return (
        <>
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.5.0/semantic.min.css"
                integrity="sha512-KXol4x3sVoO+8ZsWPFI/r5KBVB/ssCGB5tsv2nVOKwLg33wTFP3fmnXa47FdSVIshVTgsYk/1734xSk9aFIa4A=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
            />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css" crossOrigin="anonymous" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/golden-layout/1.5.9/css/goldenlayout-base.css" crossOrigin="anonymous" />
            <link id="judge0-golden-layout-light-theme-stylesheet" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/golden-layout/1.5.9/css/goldenlayout-light-theme.css" crossOrigin="anonymous" />
            <link id="judge0-golden-layout-dark-theme-stylesheet" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/golden-layout/1.5.9/css/goldenlayout-dark-theme.css" crossOrigin="anonymous" />
            <link rel="stylesheet" href="/css/ide.css" />
            <link rel="stylesheet" href="/css/semantic.css" />
            <link rel="stylesheet" href="/css/site.css" />

            {children}

            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
                integrity="sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                strategy="afterInteractive"
            />

            {/* Monaco: set require config then load in strict order */}
            <Script id="monaco-loader" strategy="afterInteractive">{`
                (function() {
                    function loadScript(src, cb) {
                        var s = document.createElement('script');
                        s.src = src;
                        s.onload = cb;
                        document.head.appendChild(s);
                    }
                    window.require = { paths: { "vs": "/vendor/monaco-editor-0.44.0/min/vs" } };
                    loadScript('/vendor/monaco-editor-0.44.0/min/vs/loader.js', function() {
                        loadScript('/vendor/monaco-editor-0.44.0/min/vs/editor/editor.main.nls.js', function() {
                            loadScript('/vendor/monaco-editor-0.44.0/min/vs/editor/editor.main.js', function() {
                                console.log('Monaco editor loaded');
                            });
                        });
                    });
                })();
            `}</Script>

            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.6/marked.min.js"
                integrity="sha512-rvRITpPeEKe4hV9M8XntuXX6nuohzqdR5O3W6nhjTLwkrx0ZgBQuaK4fv5DdOWzs2IaXsGt5h0+nyp9pEuoTXg=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                strategy="afterInteractive"
            />
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"
                integrity="sha512-LQNxIMR5rXv7o+b1l8+N1EZMfhG7iFZ9HhnbJkTp4zjNr5Wvst75AqUeFDxeRUa7l5vEDyUiAip//r+EFLLCyA=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                strategy="afterInteractive"
            />
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.3/purify.min.js"
                integrity="sha512-Ll+TuDvrWDNNRnFFIM8dOiw7Go7dsHyxRp4RutiIFW/wm3DgDmCnRZow6AqbXnCbpWu93yM1O34q+4ggzGeXVA=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                strategy="afterInteractive"
            />
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/golden-layout/1.5.9/goldenlayout.min.js"
                integrity="sha256-NhJAZDfGgv4PiB+GVlSrPdh3uc75XXYSM4su8hgTchI="
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.5.0/semantic.min.js"
                integrity="sha512-Xo0Jh8MsOn72LGV8kU5LsclG7SUzJsWGhXbWcYs2MAmChkQzwiW/yTQwdJ8w6UA9C6EVG18GHb/TrYpYCjyAQw=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                strategy="afterInteractive"
            />
            <Script id="sw-register" strategy="afterInteractive">{`
                if ("serviceWorker" in navigator) {
                    navigator.serviceWorker.register("/sw.js").then(() => console.log("Service Worker Registered"));
                }
            `}</Script>
        </>
    );
}
