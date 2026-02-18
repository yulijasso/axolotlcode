"use client";
import { useEffect, useRef } from "react";
import { UserButton, SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import theme from "../lib/theme.js";
import style from "../lib/style.js";
import ls from "../lib/localStorage.js";
import { IS_ELECTRON } from "../lib/electron.js";
import {
    encode,
    decode,
    AUTH_HEADERS,
    CE,
    EXTRA_CE,
    AUTHENTICATED_BASE_URL,
    UNAUTHENTICATED_BASE_URL,
    UNAUTHENTICATED_CE_BASE_URL,
    UNAUTHENTICATED_EXTRA_CE_BASE_URL,
    INITIAL_WAIT_TIME_MS,
    WAIT_TIME_FUNCTION,
    MAX_PROBE_REQUESTS,
} from "../lib/judge0.js";
import { getEditorLanguageMode, getLanguageForExtension } from "../lib/languages.js";
import { getSession, updateSession } from "../lib/sessions.js";

// AI chat thread (module-level so it persists across renders)
const THREAD = [
    {
        role: "system",
        content: `
You are an AI assistant integrated into an online code editor.
Your main job is to help users with their code by suggesting and applying fixes or explaining specific lines or concepts.

**Guidelines:**
1. If the user's code has issues (e.g., incorrect types, syntax errors, bad practices), provide a **corrected version**.
2. If a change is needed, return the **entire modified code** inside:
   \`\`\`fixed
   (modified code here)
   \`\`\`
3. If the user asks about specific lines or concepts, provide a **clear explanation**.
4. Do **not** make unnecessary changes. Only modify what's needed.
5. If no fixes are needed, just explain why.
`.trim()
    }
];

const DEFAULT_SOURCE = "\
#include <algorithm>\n\
#include <cstdint>\n\
#include <iostream>\n\
#include <limits>\n\
#include <set>\n\
#include <utility>\n\
#include <vector>\n\
\n\
using Vertex    = std::uint16_t;\n\
using Cost      = std::uint16_t;\n\
using Edge      = std::pair< Vertex, Cost >;\n\
using Graph     = std::vector< std::vector< Edge > >;\n\
using CostTable = std::vector< std::uint64_t >;\n\
\n\
constexpr auto kInfiniteCost{ std::numeric_limits< CostTable::value_type >::max() };\n\
\n\
auto dijkstra( Vertex const start, Vertex const end, Graph const & graph, CostTable & costTable )\n\
{\n\
    std::fill( costTable.begin(), costTable.end(), kInfiniteCost );\n\
    costTable[ start ] = 0;\n\
\n\
    std::set< std::pair< CostTable::value_type, Vertex > > minHeap;\n\
    minHeap.emplace( 0, start );\n\
\n\
    while ( !minHeap.empty() )\n\
    {\n\
        auto const vertexCost{ minHeap.begin()->first  };\n\
        auto const vertex    { minHeap.begin()->second };\n\
\n\
        minHeap.erase( minHeap.begin() );\n\
\n\
        if ( vertex == end )\n\
        {\n\
            break;\n\
        }\n\
\n\
        for ( auto const & neighbourEdge : graph[ vertex ] )\n\
        {\n\
            auto const & neighbour{ neighbourEdge.first };\n\
            auto const & cost{ neighbourEdge.second };\n\
\n\
            if ( costTable[ neighbour ] > vertexCost + cost )\n\
            {\n\
                minHeap.erase( { costTable[ neighbour ], neighbour } );\n\
                costTable[ neighbour ] = vertexCost + cost;\n\
                minHeap.emplace( costTable[ neighbour ], neighbour );\n\
            }\n\
        }\n\
    }\n\
\n\
    return costTable[ end ];\n\
}\n\
\n\
int main()\n\
{\n\
    constexpr std::uint16_t maxVertices{ 10000 };\n\
\n\
    Graph     graph    ( maxVertices );\n\
    CostTable costTable( maxVertices );\n\
\n\
    std::uint16_t testCases;\n\
    std::cin >> testCases;\n\
\n\
    while ( testCases-- > 0 )\n\
    {\n\
        for ( auto i{ 0 }; i < maxVertices; ++i )\n\
        {\n\
            graph[ i ].clear();\n\
        }\n\
\n\
        std::uint16_t numberOfVertices;\n\
        std::uint16_t numberOfEdges;\n\
\n\
        std::cin >> numberOfVertices >> numberOfEdges;\n\
\n\
        for ( auto i{ 0 }; i < numberOfEdges; ++i )\n\
        {\n\
            Vertex from;\n\
            Vertex to;\n\
            Cost   cost;\n\
\n\
            std::cin >> from >> to >> cost;\n\
            graph[ from ].emplace_back( to, cost );\n\
        }\n\
\n\
        Vertex start;\n\
        Vertex end;\n\
\n\
        std::cin >> start >> end;\n\
\n\
        auto const result{ dijkstra( start, end, graph, costTable ) };\n\
\n\
        if ( result == kInfiniteCost )\n\
        {\n\
            std::cout << \"NO\\n\";\n\
        }\n\
        else\n\
        {\n\
            std::cout << result << '\\n';\n\
        }\n\
    }\n\
\n\
    return 0;\n\
}\n\
";

const DEFAULT_STDIN = "\
3\n\
3 2\n\
1 2 5\n\
2 3 7\n\
1 3\n\
3 3\n\
1 2 4\n\
1 3 7\n\
2 3 1\n\
1 3\n\
3 1\n\
1 2 4\n\
1 3\n\
";

const DEFAULT_COMPILER_OPTIONS = "";
const DEFAULT_CMD_ARGUMENTS = "";
const DEFAULT_LANGUAGE_ID = 105;

const layoutConfig = {
    settings: {
        showPopoutIcon: false,
        reorderEnabled: true
    },
    content: [{
        type: "row",
        content: [{
            type: "component",
            width: 66,
            componentName: "source",
            id: "source",
            title: "Source Code",
            isClosable: false,
            componentState: { readOnly: false }
        }, {
            type: "column",
            content: [{
                type: "component",
                height: 66,
                componentName: "ai",
                id: "ai",
                title: "AI Assistant",
                isClosable: false,
                componentState: { readOnly: false }
            }, {
                type: "stack",
                content: [
                    {
                        type: "component",
                        componentName: "stdin",
                        id: "stdin",
                        title: "Input",
                        isClosable: false,
                        componentState: { readOnly: false }
                    },
                    {
                        type: "component",
                        componentName: "stdout",
                        id: "stdout",
                        title: "Output",
                        isClosable: false,
                        componentState: { readOnly: true }
                    }
                ]
            }]
        }]
    }]
};

export default function IDE() {
    const layoutRef = useRef(null);
    const sourceEditorRef = useRef(null);
    const stdinEditorRef = useRef(null);
    const stdoutEditorRef = useRef(null);
    const sqliteAdditionalFilesRef = useRef(null);
    const fontSizeRef = useRef(13);
    const timeStartRef = useRef(null);
    const languagesRef = useRef({});
    const initializedRef = useRef(false);
    const sessionIdRef = useRef(null);
    const filesRef = useRef([]);       // tree: { type, name, content?, languageId?, flavor?, languageName?, children?, expanded? }
    const activeFileRef = useRef(null); // direct reference to the active file node
    const { isSignedIn } = useAuth();
    const isSignedInRef = useRef(false);
    useEffect(() => { isSignedInRef.current = !!isSignedIn; }, [isSignedIn]);

    useEffect(() => {
        if (initializedRef.current) return;

        // Poll until all CDN globals are ready
        const waitForGlobals = () => new Promise(resolve => {
            const check = () => {
                if (
                    typeof window.$ !== "undefined" &&
                    typeof window.GoldenLayout !== "undefined" &&
                    typeof window.monaco !== "undefined" &&
                    typeof window.marked !== "undefined" &&
                    typeof window.DOMPurify !== "undefined"
                ) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });

        waitForGlobals().then(() => {
            if (initializedRef.current) return;
            initializedRef.current = true;
            init();
        });

        function getQuery(variable) {
            const query = window.location.search.substring(1);
            const vars = query.split("&");
            for (let i = 0; i < vars.length; i++) {
                const pair = vars[i].split("=");
                if (decodeURIComponent(pair[0]) === variable) {
                    return decodeURIComponent(pair[1]);
                }
            }
        }

        function showError(title, content) {
            document.querySelector("#judge0-site-modal #title").innerHTML = title;
            document.querySelector("#judge0-site-modal .content").innerHTML = content;

            let reportTitle = encodeURIComponent(`Error on ${window.location.href}`);
            let reportBody = encodeURIComponent(
                `**Error Title**: ${title}\n` +
                `**Error Timestamp**: \`${new Date()}\`\n` +
                `**Origin**: ${window.location.href}\n` +
                `**Description**:\n${content}`
            );

            document.getElementById("report-problem-btn").href = `https://github.com/judge0/ide/issues/new?title=${reportTitle}&body=${reportBody}`;
            window.$("#judge0-site-modal").modal("show");
        }

        function showHttpError(jqXHR) {
            showError(`${jqXHR.statusText} (${jqXHR.status})`, `<pre>${JSON.stringify(jqXHR, null, 4)}</pre>`);
        }

        function handleRunError(jqXHR) {
            showHttpError(jqXHR);
            window.$("#run-btn").removeClass("loading");

            window.top.postMessage(JSON.parse(JSON.stringify({
                event: "runError",
                data: jqXHR
            })), "*");
        }

        function handleResult(data) {
            const tat = Math.round(performance.now() - timeStartRef.current);
            console.log(`It took ${tat}ms to get submission result.`);

            const status = data.status;
            const stdout = decode(data.stdout);
            const compileOutput = decode(data.compile_output);
            const time = (data.time === null ? "-" : data.time + "s");
            const memory = (data.memory === null ? "-" : data.memory + "KB");

            document.getElementById("judge0-status-line").innerHTML = `${status.description}, ${time}, ${memory} (TAT: ${tat}ms)`;

            const output = [compileOutput, stdout].join("\n").trim();
            stdoutEditorRef.current.setValue(output);
            window.$("#run-btn").removeClass("loading");

            window.top.postMessage(JSON.parse(JSON.stringify({
                event: "postExecution",
                status: data.status,
                time: data.time,
                memory: data.memory,
                output: output
            })), "*");
        }

        function getSelectedLanguageId() {
            return parseInt(window.$("#select-language").val());
        }

        function getSelectedLanguageFlavor() {
            return window.$("#select-language").find(":selected").attr("flavor");
        }

        async function getSelectedLanguage() {
            return getLanguage(getSelectedLanguageFlavor(), getSelectedLanguageId());
        }

        function fetchSubmission(flavor, region, submission_token, iteration) {
            if (iteration >= MAX_PROBE_REQUESTS) {
                handleRunError({ statusText: "Maximum number of probe requests reached.", status: 504 }, null, null);
                return;
            }

            window.$.ajax({
                url: `${UNAUTHENTICATED_BASE_URL[flavor]}/submissions/${submission_token}?base64_encoded=true`,
                headers: { "X-Judge0-Region": region },
                success: function (data) {
                    if (data.status.id <= 2) {
                        document.getElementById("judge0-status-line").innerHTML = data.status.description;
                        setTimeout(fetchSubmission.bind(null, flavor, region, submission_token, iteration + 1), WAIT_TIME_FUNCTION(iteration));
                    } else {
                        handleResult(data);
                    }
                },
                error: handleRunError
            });
        }

        function run() {
            const sourceEditor = sourceEditorRef.current;
            const stdinEditor = stdinEditorRef.current;
            const stdoutEditor = stdoutEditorRef.current;
            const layout = layoutRef.current;

            if (sourceEditor.getValue().trim() === "") {
                showError("Error", "Source code can't be empty!");
                return;
            } else {
                window.$("#run-btn").addClass("loading");
            }

            stdoutEditor.setValue("");
            document.getElementById("judge0-status-line").innerHTML = "";

            let x = layout.root.getItemsById("stdout")[0];
            x.parent.header.parent.setActiveContentItem(x);

            let sourceValue = encode(sourceEditor.getValue());
            let stdinValue = encode(stdinEditor.getValue());
            let languageId = getSelectedLanguageId();
            let compilerOptions = window.$("#compiler-options").val();
            let commandLineArguments = window.$("#command-line-arguments").val();
            let flavor = getSelectedLanguageFlavor();

            if (languageId === 44) {
                sourceValue = sourceEditor.getValue();
            }

            let data = {
                source_code: sourceValue,
                language_id: languageId,
                stdin: stdinValue,
                compiler_options: compilerOptions,
                command_line_arguments: commandLineArguments,
                redirect_stderr_to_stdout: true
            };

            let sendRequest = function (data) {
                window.top.postMessage(JSON.parse(JSON.stringify({
                    event: "preExecution",
                    source_code: sourceEditor.getValue(),
                    language_id: languageId,
                    flavor: flavor,
                    stdin: stdinEditor.getValue(),
                    compiler_options: compilerOptions,
                    command_line_arguments: commandLineArguments
                })), "*");

                timeStartRef.current = performance.now();
                const submitBaseUrl = AUTH_HEADERS["Authorization"]
                    ? AUTHENTICATED_BASE_URL[flavor]
                    : UNAUTHENTICATED_BASE_URL[flavor];
                window.$.ajax({
                    url: `${submitBaseUrl}/submissions?base64_encoded=true&wait=false`,
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    headers: AUTH_HEADERS,
                    success: function (data, textStatus, request) {
                        console.log(`Your submission token is: ${data.token}`);
                        let region = request.getResponseHeader('X-Judge0-Region');
                        setTimeout(fetchSubmission.bind(null, flavor, region, data.token, 1), INITIAL_WAIT_TIME_MS);
                    },
                    error: handleRunError
                });
            };

            if (languageId === 82) {
                if (!sqliteAdditionalFilesRef.current) {
                    window.$.ajax({
                        url: `/data/additional_files_zip_base64.txt`,
                        contentType: "text/plain",
                        success: function (responseData) {
                            sqliteAdditionalFilesRef.current = responseData;
                            data["additional_files"] = sqliteAdditionalFilesRef.current;
                            sendRequest(data);
                        },
                        error: handleRunError
                    });
                } else {
                    data["additional_files"] = sqliteAdditionalFilesRef.current;
                    sendRequest(data);
                }
            } else {
                sendRequest(data);
            }
        }

        function setSourceCodeName(name) {
            const titles = document.querySelectorAll(".lm_title");
            if (titles[0]) titles[0].innerText = name;
        }

        function getSourceCodeName() {
            const titles = document.querySelectorAll(".lm_title");
            return titles[0] ? titles[0].innerText : "source";
        }

        function openFile(content, filename) {
            clear();
            sourceEditorRef.current.setValue(content);
            selectLanguageForExtension(filename.split(".").pop());
            setSourceCodeName(filename);
        }

        function saveFile(content, filename) {
            const blob = new Blob([content], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }

        function openAction() {
            document.getElementById("open-file-input").click();
        }

        function saveAction() {
            saveFile(sourceEditorRef.current.getValue(), getSourceCodeName());
        }

        function setFontSizeForAllEditors(size) {
            sourceEditorRef.current.updateOptions({ fontSize: size });
            stdinEditorRef.current.updateOptions({ fontSize: size });
            stdoutEditorRef.current.updateOptions({ fontSize: size });
        }

        function selectLanguageByFlavorAndId(languageId, flavor) {
            let option = window.$(`#select-language [value=${languageId}][flavor=${flavor}]`);
            if (option.length) {
                option.prop("selected", true);
                window.$("#select-language").trigger("change", { skipSetDefaultSourceCodeName: true });
            }
        }

        function selectLanguageForExtension(extension) {
            let language = getLanguageForExtension(extension);
            selectLanguageByFlavorAndId(language.language_id, language.flavor);
        }

        async function getLanguage(flavor, languageId) {
            return new Promise((resolve, reject) => {
                const langs = languagesRef.current;
                if (langs[flavor] && langs[flavor][languageId]) {
                    resolve(langs[flavor][languageId]);
                    return;
                }

                window.$.ajax({
                    url: `${UNAUTHENTICATED_BASE_URL[flavor]}/languages/${languageId}`,
                    success: function (data) {
                        if (!langs[flavor]) langs[flavor] = {};
                        langs[flavor][languageId] = data;
                        resolve(data);
                    },
                    error: reject
                });
            });
        }

        // ---- Multi-file / folder / tab helpers ----
        let draggedNode = null;
        let listDragReady = false;
        let openTabs = [];

        function renderTabBar() {
            const bar = document.getElementById("judge0-tab-bar");
            if (!bar) return;
            bar.innerHTML = "";
            openTabs.forEach(fileNode => {
                const tab = document.createElement("div");
                tab.className = "judge0-tab" + (fileNode === activeFileRef.current ? " active" : "");

                const name = document.createElement("span");
                name.textContent = fileNode.name;

                const close = document.createElement("span");
                close.className = "judge0-tab-close";
                close.textContent = "×";
                close.addEventListener("click", (e) => { e.stopPropagation(); closeTab(fileNode); });

                tab.appendChild(name);
                tab.appendChild(close);
                tab.addEventListener("click", () => switchToFile(fileNode));
                bar.appendChild(tab);
            });
        }

        function openTab(fileNode) {
            if (!openTabs.includes(fileNode)) openTabs.push(fileNode);
            switchToFile(fileNode);
        }

        function closeTab(fileNode) {
            const idx = openTabs.indexOf(fileNode);
            if (idx === -1) return;
            openTabs.splice(idx, 1);
            if (activeFileRef.current === fileNode) {
                const next = openTabs[Math.min(idx, openTabs.length - 1)];
                if (next) {
                    switchToFile(next);
                } else {
                    activeFileRef.current = null;
                    sourceEditorRef.current.setValue("");
                    renderFileList();
                    renderTabBar();
                }
            } else {
                renderTabBar();
            }
        }

        function isDescendantOf(target, ancestor) {
            if (ancestor.type !== "folder") return false;
            return (ancestor.children || []).some(c => c === target || isDescendantOf(target, c));
        }

        function findAndRemoveNode(nodes, target) {
            const idx = nodes.indexOf(target);
            if (idx !== -1) { nodes.splice(idx, 1); return true; }
            return nodes.some(n => n.type === "folder" && findAndRemoveNode(n.children || [], target));
        }

        function renderFileList() {
            const list = document.getElementById("judge0-file-list");
            if (!list) return;
            list.innerHTML = "";

            // Root-level drop zone (once per list element)
            if (!listDragReady) {
                listDragReady = true;
                list.addEventListener("dragover", (e) => {
                    if (!draggedNode || document.querySelector(".judge0-drop-target")) return;
                    e.preventDefault();
                    list.classList.add("judge0-list-drop-target");
                });
                list.addEventListener("dragleave", (e) => {
                    if (!list.contains(e.relatedTarget)) list.classList.remove("judge0-list-drop-target");
                });
                list.addEventListener("drop", (e) => {
                    list.classList.remove("judge0-list-drop-target");
                    if (!draggedNode || document.querySelector(".judge0-drop-target")) return;
                    e.preventDefault();
                    findAndRemoveNode(filesRef.current, draggedNode);
                    filesRef.current.push(draggedNode);
                    draggedNode = null;
                    renderFileList();
                });
            }

            function renderNodes(nodes, depth) {
                nodes.forEach(node => {
                    const item = document.createElement("div");
                    item.className = "judge0-file-item" + (node === activeFileRef.current ? " active" : "");
                    item.style.paddingLeft = `${12 + depth * 14}px`;
                    item.setAttribute("draggable", "true");

                    if (node.type === "folder") {
                        item.innerHTML = `<i class="caret ${node.expanded ? "down" : "right"} icon" style="font-size:10px;width:10px;opacity:0.55;flex-shrink:0"></i><i class="${node.expanded ? "folder open" : "folder"} outline icon" style="flex-shrink:0"></i><span>${node.name}</span>`;
                        item.addEventListener("click", () => { node.expanded = !node.expanded; renderFileList(); });
                        item.addEventListener("dragover", (e) => {
                            if (!draggedNode || draggedNode === node || isDescendantOf(node, draggedNode)) return;
                            e.preventDefault(); e.stopPropagation();
                            document.querySelectorAll(".judge0-drop-target").forEach(el => el.classList.remove("judge0-drop-target"));
                            item.classList.add("judge0-drop-target");
                            list.classList.remove("judge0-list-drop-target");
                        });
                        item.addEventListener("dragleave", (e) => {
                            if (!item.contains(e.relatedTarget)) item.classList.remove("judge0-drop-target");
                        });
                        item.addEventListener("drop", (e) => {
                            e.preventDefault(); e.stopPropagation();
                            item.classList.remove("judge0-drop-target");
                            if (!draggedNode || draggedNode === node || isDescendantOf(node, draggedNode)) return;
                            findAndRemoveNode(filesRef.current, draggedNode);
                            (node.children = node.children || []).push(draggedNode);
                            node.expanded = true;
                            draggedNode = null;
                            renderFileList();
                        });
                    } else {
                        item.innerHTML = `<i class="file code outline icon" style="width:14px;flex-shrink:0"></i><span>${node.name}</span>`;
                        item.addEventListener("click", () => switchToFile(node));
                        item.addEventListener("dblclick", () => openTab(node));
                    }

                    item.addEventListener("dragstart", (e) => {
                        draggedNode = node;
                        e.dataTransfer.effectAllowed = "move";
                        setTimeout(() => item.classList.add("dragging"), 0);
                    });
                    item.addEventListener("dragend", () => {
                        draggedNode = null;
                        document.querySelectorAll(".dragging, .judge0-drop-target, .judge0-list-drop-target")
                            .forEach(el => el.classList.remove("dragging", "judge0-drop-target", "judge0-list-drop-target"));
                    });

                    list.appendChild(item);
                    if (node.type === "folder" && node.expanded && node.children?.length) {
                        renderNodes(node.children, depth + 1);
                    }
                });
            }
            renderNodes(filesRef.current, 0);
        }

        function saveCurrentFileState() {
            const file = activeFileRef.current;
            if (!file || file.type !== "file") return;
            const opt = window.$("#select-language").find(":selected");
            file.content = sourceEditorRef.current.getValue();
            file.languageId = parseInt(opt.val());
            file.flavor = opt.attr("flavor");
            file.languageName = opt.text();
        }

        function switchToFile(fileNode) {
            saveCurrentFileState();
            activeFileRef.current = fileNode;
            sourceEditorRef.current.setValue(fileNode.content || "");
            if (fileNode.languageId && fileNode.flavor) {
                selectLanguageByFlavorAndId(fileNode.languageId, fileNode.flavor);
            }
            renderFileList();
            renderTabBar();
        }
        // --------------------------------------

        async function loadSelectedLanguage(skipSetDefaultSourceCodeName = false) {
            window.monaco.editor.setModelLanguage(
                sourceEditorRef.current.getModel(),
                window.$("#select-language").find(":selected").attr("langauge_mode")
            );

            if (!skipSetDefaultSourceCodeName) {
                setSourceCodeName((await getSelectedLanguage()).source_file);
            }
        }

        async function setDefaults() {
            setFontSizeForAllEditors(fontSizeRef.current);

            const sessionId = getQuery("session");
            let sessionData = null;

            if (sessionId) {
                // Try localStorage first (fast, works offline)
                sessionData = getSession(sessionId);

                // If not found locally and user is signed in, try cloud
                if (!sessionData && isSignedInRef.current) {
                    try {
                        const res = await fetch(`/api/sessions/${sessionId}`);
                        if (res.ok) sessionData = await res.json();
                    } catch { /* network error — continue with no session */ }
                }

                if (sessionData) sessionIdRef.current = sessionId;
            }

            if (sessionData) {
                sourceEditorRef.current.setValue(sessionData.code || "");
                stdinEditorRef.current.setValue(sessionData.stdin || "");
                window.$("#compiler-options").val(sessionData.compilerOptions || "");
                window.$("#command-line-arguments").val(sessionData.cmdArguments || "");
                document.getElementById("judge0-status-line").innerHTML = "";
                if (sessionData.languageId && sessionData.flavor) {
                    selectLanguageByFlavorAndId(sessionData.languageId, sessionData.flavor);
                }
            } else {
                sourceEditorRef.current.setValue(DEFAULT_SOURCE);
                stdinEditorRef.current.setValue(DEFAULT_STDIN);
                window.$("#compiler-options").val(DEFAULT_COMPILER_OPTIONS);
                window.$("#command-line-arguments").val(DEFAULT_CMD_ARGUMENTS);
                document.getElementById("judge0-status-line").innerHTML = "";

                const langParam = getQuery("lang");
                if (langParam) {
                    selectLanguageForExtension(langParam);
                } else {
                    loadSelectedLanguage();
                }
            }
        }

        function clear() {
            sourceEditorRef.current.setValue("");
            stdinEditorRef.current.setValue("");
            window.$("#compiler-options").val("");
            window.$("#command-line-arguments").val("");
            document.getElementById("judge0-status-line").innerHTML = "";
        }

        function refreshSiteContentHeight() {
            const nav = document.getElementById("judge0-site-navigation");
            const siteContent = document.getElementById("judge0-site-content");
            const sidebar = document.getElementById("judge0-sidebar");
            const tabBar = document.getElementById("judge0-tab-bar");
            const sidebarW = sidebar ? sidebar.offsetWidth : 0;
            const navH = nav.offsetHeight;
            const tabH = tabBar ? tabBar.offsetHeight : 0;
            siteContent.style.height = `${window.innerHeight}px`;
            siteContent.style.paddingTop = `${navH + tabH}px`;
            siteContent.style.marginLeft = `${sidebarW}px`;
            siteContent.style.width = `${window.innerWidth - sidebarW}px`;
            if (sidebar) sidebar.style.top = `${navH}px`;
            if (tabBar) { tabBar.style.top = `${navH}px`; tabBar.style.left = `${sidebarW}px`; }
        }

        function refreshLayoutSize() {
            refreshSiteContentHeight();
            if (layoutRef.current) layoutRef.current.updateSize();
        }

        async function loadLanguages() {
            return new Promise((resolve, reject) => {
                let options = [];

                window.$.ajax({
                    url: UNAUTHENTICATED_CE_BASE_URL + "/languages",
                    success: function (data) {
                        for (let i = 0; i < data.length; i++) {
                            let language = data[i];
                            let option = new Option(language.name, language.id);
                            option.setAttribute("flavor", CE);
                            option.setAttribute("langauge_mode", getEditorLanguageMode(language.name));

                            if (language.id !== 89) {
                                options.push(option);
                            }

                            if (language.id === DEFAULT_LANGUAGE_ID) {
                                option.selected = true;
                            }
                        }
                    },
                    error: reject
                }).always(function () {
                    window.$.ajax({
                        url: UNAUTHENTICATED_EXTRA_CE_BASE_URL + "/languages",
                        success: function (data) {
                            for (let i = 0; i < data.length; i++) {
                                let language = data[i];
                                let option = new Option(language.name, language.id);
                                option.setAttribute("flavor", EXTRA_CE);
                                option.setAttribute("langauge_mode", getEditorLanguageMode(language.name));

                                if (options.findIndex((t) => (t.text === option.text)) === -1 && language.id !== 89) {
                                    options.push(option);
                                }
                            }
                        },
                        error: reject
                    }).always(function () {
                        options.sort((a, b) => a.text.localeCompare(b.text));
                        window.$("#select-language").append(options);
                        resolve();
                    });
                });
            });
        }

        // --- AI chat helpers ---
        function extractLineNumber(userInput) {
            const match = userInput.match(/line (\d+)/i);
            return match ? parseInt(match[1], 10) - 1 : null;
        }

        function extractCodeSnippet(code, lineNumber) {
            if (lineNumber === null) return "";
            const lines = code.split('\n');
            return lines[lineNumber] || "";
        }

        // --- Main init ---
        async function init() {
            // Semantic UI dropdowns
            window.$(".ui.selection.dropdown").dropdown();
            window.$("[data-content]").popup({ lastResort: "left center" });

            refreshSiteContentHeight();
            console.log("Hey, Judge0 IDE is open-sourced: https://github.com/judge0/ide. Have fun!");

            const $selectLanguage = window.$("#select-language");
            $selectLanguage.change(function (event, data) {
                let skipSetDefaultSourceCodeName = (data && data.skipSetDefaultSourceCodeName);
                const skipSetDefault = (data && data.skipSetDefaultSourceCodeName);
                loadSelectedLanguage(skipSetDefault);
            });

            await loadLanguages();

            window.$("#run-btn").click(run);

            window.$("#open-file-input").change(function (e) {
                const selectedFile = e.target.files[0];
                if (selectedFile) {
                    const reader = new FileReader();
                    reader.onload = function (e) { openFile(e.target.result, selectedFile.name); };
                    reader.onerror = function (e) { showError("Error", "Error reading file: " + e.target.error); };
                    reader.readAsText(selectedFile);
                }
            });

            // Keyboard shortcuts
            window.$(document).on("keydown", "body", function (e) {
                if (e.metaKey || e.ctrlKey) {
                    switch (e.key) {
                        case "Enter":
                            e.preventDefault(); run(); break;
                        case "s":
                            e.preventDefault(); saveAction(); break;
                        case "o":
                            e.preventDefault(); openAction(); break;
                        case "+": case "=":
                            e.preventDefault();
                            fontSizeRef.current += 1;
                            setFontSizeForAllEditors(fontSizeRef.current); break;
                        case "-":
                            e.preventDefault();
                            fontSizeRef.current -= 1;
                            setFontSizeForAllEditors(fontSizeRef.current); break;
                        case "0":
                            e.preventDefault();
                            fontSizeRef.current = 13;
                            setFontSizeForAllEditors(fontSizeRef.current); break;
                        case "`":
                            e.preventDefault();
                            sourceEditorRef.current.focus(); break;
                        case "p":
                            e.preventDefault();
                            document.getElementById("judge0-chat-user-input").focus(); break;
                    }
                }
            });

            // GoldenLayout + Monaco setup (window.require = Monaco AMD loader, not webpack)
            window.require(["vs/editor/editor.main"], function () {
                const layout = new window.GoldenLayout(layoutConfig, window.$("#judge0-site-content"));
                layoutRef.current = layout;

                layout.registerComponent("source", function (container, state) {
                    const editor = window.monaco.editor.create(container.getElement()[0], {
                        automaticLayout: true,
                        scrollBeyondLastLine: true,
                        readOnly: state.readOnly,
                        language: "cpp",
                        fontFamily: "JetBrains Mono",
                        minimap: { enabled: true }
                    });
                    sourceEditorRef.current = editor;

                    editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, run);
                });

                layout.registerComponent("stdin", function (container, state) {
                    stdinEditorRef.current = window.monaco.editor.create(container.getElement()[0], {
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        readOnly: state.readOnly,
                        language: "plaintext",
                        fontFamily: "JetBrains Mono",
                        minimap: { enabled: false }
                    });
                });

                layout.registerComponent("stdout", function (container, state) {
                    stdoutEditorRef.current = window.monaco.editor.create(container.getElement()[0], {
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        readOnly: state.readOnly,
                        language: "plaintext",
                        fontFamily: "JetBrains Mono",
                        minimap: { enabled: false }
                    });
                });

                layout.registerComponent("ai", function (container) {
                    container.getElement()[0].appendChild(document.getElementById("judge0-chat-container"));
                });

                layout.on("initialised", async function () {
                    await setDefaults();
                    refreshLayoutSize();
                    window.top.postMessage({ event: "initialised" }, "*");

                    // Init file list with the first file
                    const opt = window.$("#select-language").find(":selected");
                    const firstFile = {
                        type: "file",
                        name: getSourceCodeName() || "main.cpp",
                        content: sourceEditorRef.current.getValue(),
                        languageId: parseInt(opt.val()),
                        flavor: opt.attr("flavor"),
                        languageName: opt.text(),
                    };
                    filesRef.current = [firstFile];
                    activeFileRef.current = firstFile;
                    openTabs = [firstFile];
                    renderFileList();
                    renderTabBar();

                    // Auto-save session content on changes
                    let saveTimer = null;
                    function scheduleSave() {
                        if (!sessionIdRef.current) return;
                        clearTimeout(saveTimer);
                        saveTimer = setTimeout(() => {
                            const opt = window.$("#select-language").find(":selected");
                            const data = {
                                code: sourceEditorRef.current?.getValue() || "",
                                stdin: stdinEditorRef.current?.getValue() || "",
                                languageId: parseInt(opt.val()),
                                flavor: opt.attr("flavor") || "CE",
                                languageName: opt.text(),
                                compilerOptions: window.$("#compiler-options").val() || "",
                                cmdArguments: window.$("#command-line-arguments").val() || "",
                            };
                            if (isSignedInRef.current) {
                                fetch(`/api/sessions/${sessionIdRef.current}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(data),
                                }).catch(() => {});
                            } else {
                                updateSession(sessionIdRef.current, data);
                            }
                        }, 1500);
                    }
                    sourceEditorRef.current.onDidChangeModelContent(scheduleSave);
                    stdinEditorRef.current.onDidChangeModelContent(scheduleSave);
                    window.$("#select-language").on("change.session", scheduleSave);
                });

                layout.init();
            });

            // Super key label
            let superKey = "⌘";
            if (!/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
                superKey = "Ctrl";
            }

            window.$("#run-btn").attr("data-content", `${superKey}${window.$("#run-btn").attr("data-content")}`);
            document.querySelectorAll(".description").forEach(e => {
                e.innerText = `${superKey}${e.innerText}`;
            });

            // Theme init
            window.require(["vs/editor/editor.main"], function () {
                theme.set(getQuery("theme"));
            });

            document.getElementById("judge0-theme-toggle-btn").addEventListener("click", theme.toggle);

            // System theme change listener
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
                ["system", "reverse-system"].forEach(t => {
                    if (theme.get() === t) {
                        theme.set(t, false);
                    }
                });
            });

            // Style init
            if (IS_ELECTRON) {
                style.apply("electron");
            } else {
                style.apply(getQuery("style"));
            }

            // File open/save buttons
            document.getElementById("judge0-open-file-btn").addEventListener("click", openAction);
            document.getElementById("judge0-save-btn").addEventListener("click", saveAction);

            // Window message handler
            window.onmessage = function (e) {
                if (!e.data) return;

                if (e.data.action === "get") {
                    window.top.postMessage(JSON.parse(JSON.stringify({
                        event: "getResponse",
                        source_code: sourceEditorRef.current.getValue(),
                        language_id: getSelectedLanguageId(),
                        flavor: getSelectedLanguageFlavor(),
                        stdin: stdinEditorRef.current.getValue(),
                        stdout: stdoutEditorRef.current.getValue(),
                        compiler_options: window.$("#compiler-options").val(),
                        command_line_arguments: window.$("#command-line-arguments").val()
                    })), "*");
                } else if (e.data.action === "set") {
                    if (e.data.source_code) sourceEditorRef.current.setValue(e.data.source_code);
                    if (e.data.language_id && e.data.flavor) selectLanguageByFlavorAndId(e.data.language_id, e.data.flavor);
                    if (e.data.stdin) stdinEditorRef.current.setValue(e.data.stdin);
                    if (e.data.stdout) stdoutEditorRef.current.setValue(e.data.stdout);
                    if (e.data.compiler_options) window.$("#compiler-options").val(e.data.compiler_options);
                    if (e.data.command_line_arguments) window.$("#command-line-arguments").val(e.data.command_line_arguments);
                    if (e.data.api_key) AUTH_HEADERS["Authorization"] = `Bearer ${e.data.api_key}`;
                }
            };

            window.addEventListener("resize", refreshLayoutSize);

            // AI chat init
            initAIChat();
        }

        function initAIChat() {
            const chatContainer = document.getElementById("judge0-chat-container");

            // Delete chat history button
            const deleteChatButton = document.createElement("button");
            deleteChatButton.innerText = "Delete Chat History 🗑️";
            deleteChatButton.title = "Delete Chat History";
            deleteChatButton.classList.add("ui", "button", "tiny", "white");
            deleteChatButton.style.display = "block";
            deleteChatButton.style.margin = "10px";
            chatContainer.insertBefore(deleteChatButton, chatContainer.firstChild);

            deleteChatButton.addEventListener("click", function () {
                document.getElementById("judge0-chat-messages").innerHTML = "";
                THREAD.length = 1;
            });

            // API key input
            const apiKeyInput = document.createElement("input");
            apiKeyInput.type = "password";
            apiKeyInput.placeholder = "Enter OpenRouter API Key";
            apiKeyInput.style.margin = "5px";
            apiKeyInput.value = localStorage.getItem("openrouter_api_key") || "";

            const saveApiKeyButton = document.createElement("button");
            saveApiKeyButton.innerText = "Save Key";
            saveApiKeyButton.classList.add("ui", "button", "tiny", "blue");

            chatContainer.insertBefore(apiKeyInput, chatContainer.firstChild);
            chatContainer.insertBefore(saveApiKeyButton, chatContainer.firstChild);

            saveApiKeyButton.addEventListener("click", function () {
                localStorage.setItem("openrouter_api_key", apiKeyInput.value.trim());
                alert("API Key saved!");
            });

            function getApiKey() {
                return localStorage.getItem("openrouter_api_key") || "";
            }

            document.getElementById("judge0-chat-form").addEventListener("submit", async function (event) {
                event.preventDefault();

                const userInput = document.getElementById("judge0-chat-user-input");
                const userInputValue = userInput.value.trim();
                if (userInputValue === "") return;

                const sendButton = document.getElementById("judge0-chat-send-button");
                sendButton.classList.add("loading");
                userInput.disabled = true;

                const userMessage = document.createElement("div");
                userMessage.innerText = userInputValue;
                userMessage.classList.add("ui", "message", "judge0-message", "judge0-user-message");
                if (!theme.isLight()) userMessage.classList.add("inverted");

                const messages = document.getElementById("judge0-chat-messages");
                messages.appendChild(userMessage);

                userInput.value = "";
                messages.scrollTop = messages.scrollHeight;

                let userCode = sourceEditorRef.current.getValue();
                let lineNumber = extractLineNumber(userInputValue);
                let codeSnippet = extractCodeSnippet(userCode, lineNumber);

                THREAD.push({
                    role: "user",
                    content: `
User's code:
${userCode}

User's message:
${userInputValue}

${lineNumber !== null ? `Focus on line: ${lineNumber + 1}\nSnippet: \n${codeSnippet}\n` : ''}
`.trim()
                });

                const aiMessage = document.createElement("div");
                aiMessage.classList.add("ui", "basic", "segment", "judge0-message", "loading");
                if (!theme.isLight()) aiMessage.classList.add("inverted");
                messages.appendChild(aiMessage);
                messages.scrollTop = messages.scrollHeight;

                const apiKey = getApiKey();
                if (!apiKey) {
                    aiMessage.innerText = "Please enter your API key.";
                    aiMessage.classList.remove("loading");
                    userInput.disabled = false;
                    sendButton.classList.remove("loading");
                    return;
                }

                const selectedModel = document.getElementById("judge0-chat-model-select").value || "qwen/qwen-turbo";

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: THREAD
                    })
                });

                const data = await response.json();
                let aiResponseValue = data.choices[0].message.content;

                THREAD.push({ role: "assistant", content: aiResponseValue });

                aiMessage.innerHTML = window.DOMPurify.sanitize(aiResponseValue);
                aiMessage.innerHTML = window.marked.parse(aiMessage.innerHTML);

                // Wrap code blocks in terminal-style container with copy button
                aiMessage.querySelectorAll("pre").forEach(pre => {
                    const code = pre.querySelector("code");
                    if (!code) return;
                    const langClass = [...code.classList].find(c => c.startsWith("language-"));
                    const lang = langClass ? langClass.replace("language-", "") : "";

                    const wrapper = document.createElement("div");
                    wrapper.className = "judge0-code-block";

                    const header = document.createElement("div");
                    header.className = "judge0-code-block-header";

                    const langLabel = document.createElement("span");
                    langLabel.className = "judge0-code-lang";
                    langLabel.textContent = lang;

                    const copyBtn = document.createElement("button");
                    copyBtn.className = "judge0-copy-btn";
                    copyBtn.textContent = "Copy";
                    copyBtn.addEventListener("click", () => {
                        navigator.clipboard.writeText(code.innerText).then(() => {
                            copyBtn.textContent = "Copied";
                            setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
                        });
                    });

                    header.appendChild(langLabel);
                    header.appendChild(copyBtn);
                    pre.parentNode.insertBefore(wrapper, pre);
                    wrapper.appendChild(header);
                    wrapper.appendChild(pre);
                });

                aiMessage.classList.remove("loading");
                messages.scrollTop = messages.scrollHeight;

                const fixedCodeMatch = aiResponseValue.match(/```fixed\s([\s\S]*?)```/);
                if (fixedCodeMatch) {
                    const fixedCode = fixedCodeMatch[1].trim();
                    showInlineDiff(fixedCode);
                }

                userInput.disabled = false;
                sendButton.classList.remove("loading");
                userInput.focus();
            });

            document.getElementById("judge0-chat-model-select").addEventListener("change", function () {
                document.getElementById("judge0-chat-user-input").placeholder = `Message ${this.value}`;
            });
        }

        // ---- Inline diff (Cursor-style) ----
        let diffDecorationIds = [];
        let diffOverlayWidget = null;

        function diffLines(original, modified) {
            const a = original.split("\n"), b = modified.split("\n");
            const m = a.length, n = b.length;
            const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
            for (let i = 1; i <= m; i++)
                for (let j = 1; j <= n; j++)
                    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
            const ops = [];
            let i = m, j = n;
            while (i > 0 || j > 0) {
                if (i > 0 && j > 0 && a[i-1] === b[j-1]) { ops.unshift({ type: "equal", line: a[i-1] }); i--; j--; }
                else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { ops.unshift({ type: "insert", line: b[j-1] }); j--; }
                else { ops.unshift({ type: "delete", line: a[i-1] }); i--; }
            }
            return ops;
        }

        function showInlineDiff(newCode) {
            const editor = sourceEditorRef.current;
            const originalCode = editor.getValue();

            // Clear any existing diff
            clearInlineDiff();

            const ops = diffLines(originalCode, newCode);
            const mergedLines = ops.map(op => op.line);
            const deleteLines = [], insertLines = [];
            ops.forEach((op, i) => {
                if (op.type === "delete") deleteLines.push(i + 1);
                else if (op.type === "insert") insertLines.push(i + 1);
            });

            editor.setValue(mergedLines.join("\n"));
            editor.updateOptions({ readOnly: true });

            const monaco = window.monaco;
            const newDecorations = [
                ...deleteLines.map(ln => ({
                    range: new monaco.Range(ln, 1, ln, 1),
                    options: { isWholeLine: true, className: "diff-delete-line", linesDecorationsClassName: "diff-delete-gutter" }
                })),
                ...insertLines.map(ln => ({
                    range: new monaco.Range(ln, 1, ln, 1),
                    options: { isWholeLine: true, className: "diff-insert-line", linesDecorationsClassName: "diff-insert-gutter" }
                })),
            ];
            diffDecorationIds = editor.deltaDecorations([], newDecorations);

            // Accept/Discard overlay widget
            const widgetNode = document.createElement("div");
            widgetNode.id = "judge0-diff-toolbar";
            widgetNode.classList.toggle("light-theme", theme.isLight());

            const label = document.createElement("span");
            label.className = "diff-toolbar-label";
            label.textContent = "AI changes";

            const acceptBtn = document.createElement("button");
            acceptBtn.className = "diff-accept-btn";
            acceptBtn.textContent = "✓ Accept";

            const discardBtn = document.createElement("button");
            discardBtn.className = "diff-discard-btn";
            discardBtn.textContent = "✕ Discard";

            widgetNode.appendChild(label);
            widgetNode.appendChild(acceptBtn);
            widgetNode.appendChild(discardBtn);

            diffOverlayWidget = {
                getId: () => "judge0.diff.toolbar",
                getDomNode: () => widgetNode,
                getPosition: () => null,
            };
            editor.addOverlayWidget(diffOverlayWidget);

            acceptBtn.addEventListener("click", () => {
                clearInlineDiff();
                editor.setValue(newCode);
                editor.updateOptions({ readOnly: false });
            });
            discardBtn.addEventListener("click", () => {
                clearInlineDiff();
                editor.setValue(originalCode);
                editor.updateOptions({ readOnly: false });
            });
        }

        function clearInlineDiff() {
            const editor = sourceEditorRef.current;
            if (diffDecorationIds.length) {
                editor.deltaDecorations(diffDecorationIds, []);
                diffDecorationIds = [];
            }
            if (diffOverlayWidget) {
                editor.removeOverlayWidget(diffOverlayWidget);
                diffOverlayWidget = null;
            }
        }
        // ------------------------------------

        // Sidebar toggle
        document.getElementById("judge0-files-btn").addEventListener("click", function () {
            const sidebar = document.getElementById("judge0-sidebar");
            const isOpen = sidebar.classList.toggle("open");
            this.classList.toggle("active", isOpen);
            setTimeout(refreshLayoutSize, 160);
        });

        // New file button — adds to file list (or into active folder)
        document.getElementById("judge0-new-file-btn").addEventListener("click", function () {
            const name = prompt("File name:", "untitled.txt");
            if (!name) return;
            saveCurrentFileState();
            const newFile = { type: "file", name, content: "", languageId: null, flavor: null, languageName: null };
            // Add inside active folder if one is selected, otherwise root
            const active = activeFileRef.current;
            const activeFolder = active?.type === "folder" ? active : null;
            if (activeFolder) {
                activeFolder.children.push(newFile);
                activeFolder.expanded = true;
            } else {
                filesRef.current.push(newFile);
            }
            sourceEditorRef.current.setValue("");
            const ext = name.split(".").pop();
            if (getLanguageForExtension(ext)) selectLanguageForExtension(ext);
            activeFileRef.current = newFile;
            renderFileList();
        });

        // New folder button — creates a folder at root
        document.getElementById("judge0-new-folder-btn").addEventListener("click", function () {
            const name = prompt("Folder name:", "src");
            if (!name) return;
            const newFolder = { type: "folder", name, expanded: true, children: [] };
            filesRef.current.push(newFolder);
            renderFileList();
        });

        // Sync theme across sidebar, tab bar, diff toolbar, and body class
        const sidebarThemeObserver = new MutationObserver(() => {
            const isLight = theme.isLight();
            document.body.classList.toggle("ide-light", isLight);
            const sidebar = document.getElementById("judge0-sidebar");
            const tabBar = document.getElementById("judge0-tab-bar");
            const diffToolbar = document.getElementById("judge0-diff-toolbar");
            if (sidebar) sidebar.classList.toggle("light-theme", isLight);
            if (tabBar) tabBar.classList.toggle("light-theme", isLight);
            if (diffToolbar) diffToolbar.classList.toggle("light-theme", isLight);
        });
        sidebarThemeObserver.observe(document.body, { attributes: true, attributeFilter: ["style"] });

        // Cleanup
        return () => {
            window.removeEventListener("resize", () => {});
            sidebarThemeObserver.disconnect();
        };
    }, []);

    return (
        <>
            {/* Top navigation */}
            <div id="judge0-site-navigation" className="ui top fixed borderless menu">
                <a id="judge0-header" href="https://judge0.com" target="_blank" className="header item judge0-default-visible">
                    <img id="judge0-logo" src="/images/axolotlcode.png" alt="Axolotl Code" />
                </a>
                <div className="ui simple dropdown item">
                    <span className="text">File</span>
                    <i className="dropdown icon"></i>
                    <div className="menu judge0-file-menu">
                        <div id="judge0-open-file-btn" className="item">
                            <span className="description">+O</span>
                            <span className="text"><i className="file icon"></i>Open File...</span>
                            <input type="file" id="open-file-input" style={{ display: "none" }} />
                        </div>
                        <div id="judge0-save-btn" className="item">
                            <span className="description">+S</span>
                            <span className="text"><i className="save icon"></i>Save</span>
                        </div>
                    </div>
                </div>
                <div className="ui simple dropdown item">
                    <span className="text">Help</span>
                    <i className="dropdown icon"></i>
                    <div className="menu judge0-file-menu">
                        <a href="https://github.com/judge0/ide" className="link text item" target="_blank"><i className="external square alternate icon"></i>GitHub Repository</a>
                        <a href="https://github.com/judge0/ide/tree/master/embed" className="link text item" target="_blank"><i className="external square alternate icon"></i>Embed Guide</a>
                        <a href="https://platform.sulu.sh/apis/judge0" className="link text item" target="_blank"><i className="external square alternate icon"></i>HTTP API Documentation</a>
                        <a href="PRIVACY.md" className="link text item" target="_blank"><i className="external square alternate icon"></i>Privacy Policy</a>
                        <a href="TERMS.md" className="link text item" target="_blank"><i className="external square alternate icon"></i>Terms of Service</a>
                    </div>
                </div>
                <div className="item">
                    <select id="select-language" className="ui search selection dropdown"></select>
                </div>
                <div className="item">
                    <div className="ui left icon transparent input">
                        <i className="flag icon"></i>
                        <input id="compiler-options" type="text" placeholder="Compiler options" />
                    </div>
                </div>
                <div className="item">
                    <div className="ui left icon transparent input">
                        <i className="terminal icon"></i>
                        <input id="command-line-arguments" type="text" placeholder="Command line arguments" />
                    </div>
                </div>
                <div className="item">
                    <button id="run-btn" className="ui primary labeled icon button" data-content="+↵">
                        <i className="play icon"></i>
                        Run Code
                    </button>
                </div>
                <div className="right menu">
                    <a href="/sessions" className="item judge0-minimal-hidden judge0-standalone-hidden">
                        <i className="th list icon"></i>
                        <span className="text">Sessions</span>
                    </a>
                    <div id="judge0-theme-toggle-btn" className="icon link item" data-content="">
                        <i id="judge0-theme-toggle-btn-icon" className="sun icon"></i>
                    </div>
                    <div className="item judge0-minimal-hidden">
                        <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="ui basic button">Sign In</button>
                            </SignInButton>
                        </SignedOut>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div id="judge0-tab-bar"></div>

            {/* Left sidebar */}
            <div id="judge0-sidebar" className="open">
                <div id="judge0-activity-bar">
                    <div id="judge0-files-btn" className="judge0-activity-icon active" title="Files">
                        <i className="folder icon"></i>
                    </div>
                </div>
                <div id="judge0-file-panel">
                    <div id="judge0-file-panel-header">
                        <span>Files</span>
                        <div className="judge0-panel-actions">
                            <button id="judge0-new-file-btn" className="judge0-panel-action-btn" title="New File">
                                <i className="file outline icon" style={{fontSize: "11px"}}></i>
                                <i className="plus icon" style={{fontSize: "7px", marginLeft: "-4px", marginTop: "-6px"}}></i>
                            </button>
                            <button id="judge0-new-folder-btn" className="judge0-panel-action-btn" title="New Folder">
                                <i className="folder outline icon" style={{fontSize: "11px"}}></i>
                                <i className="plus icon" style={{fontSize: "7px", marginLeft: "-4px", marginTop: "-6px"}}></i>
                            </button>
                        </div>
                    </div>
                    <div id="judge0-file-list"></div>
                </div>
            </div>

            {/* GoldenLayout container */}
            <div id="judge0-site-content"></div>

            {/* Error modal */}
            <div id="judge0-site-modal" className="ui modal">
                <div className="header">
                    <span id="title"></span>
                </div>
                <div className="scrolling content"></div>
                <div className="actions">
                    <a id="report-problem-btn" className="ui labeled icon red button" href="https://github.com/judge0/ide/issues/new?title=New+bug+report&body=Describe+the+problem." target="_blank">
                        <i className="flag icon"></i>
                        Report Problem
                    </a>
                    <div className="ui labeled icon cancel secondary button">
                        <i className="close icon"></i>
                        Close (ESC)
                    </div>
                </div>
            </div>

            {/* AI Chat container — GoldenLayout will move this div into the "ai" panel */}
            <div id="judge0-chat-container" className="ui segment">
                <div className="ui top attached borderless menu">
                    <div className="item">
                        <div className="ui toggle checked checkbox">
                            <input id="judge0-inline-suggestions" type="checkbox" defaultChecked />
                            <label>Inline Suggestions</label>
                        </div>
                    </div>
                    <div className="right menu">
                        <div className="fitted item">
                            <select id="judge0-chat-model-select" className="ui search selection dropdown item">
                                <option>gpt-4o-mini</option>
                                <option>gpt-4o</option>
                                <option>o3-mini</option>
                                <option>o1-mini</option>
                                <option>claude-3-5-sonnet</option>
                                <option>deepseek-chat</option>
                                <option>deepseek-reasoner</option>
                                <option>meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo</option>
                                <option>meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo</option>
                                <option>meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo</option>
                                <option>mistral-large-latest</option>
                                <option>pixtral-large-latest</option>
                                <option>codestral-latest</option>
                                <option>google/gemma-2-27b-it</option>
                                <option>grok-beta</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="judge0-chat-messages"></div>
                <div id="judge0-chat-input-container" className="ui basic segment">
                    <form id="judge0-chat-form" className="ui fluid action input">
                        <input id="judge0-chat-user-input" type="text" />
                        <button id="judge0-chat-send-button" className="ui primary icon button" type="submit">
                            <i className="arrow up icon"></i>
                        </button>
                    </form>
                </div>
            </div>

            {/* Status line */}
            <div id="judge0-status-line" className="ui bottom right attached mini label"></div>

            {/* Footer */}
            <a href="https://judge0.com" target="_blank" className="ui bottom center attached mini label judge0-default-visible">
                © 2016-2025 Judge0 d.o.o. – All Rights Reserved. • A Croatian 🇭🇷 company
            </a>
        </>
    );
}
