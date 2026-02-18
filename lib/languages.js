"use strict";

const CE = "CE";
const EXTRA_CE = "EXTRA_CE";

export const EXTENSIONS_TABLE = {
    "asm": { "flavor": CE, "language_id": 45 },
    "c": { "flavor": CE, "language_id": 103 },
    "cpp": { "flavor": CE, "language_id": 105 },
    "cs": { "flavor": EXTRA_CE, "language_id": 29 },
    "go": { "flavor": CE, "language_id": 95 },
    "java": { "flavor": CE, "language_id": 91 },
    "js": { "flavor": CE, "language_id": 102 },
    "lua": { "flavor": CE, "language_id": 64 },
    "pas": { "flavor": CE, "language_id": 67 },
    "php": { "flavor": CE, "language_id": 98 },
    "py": { "flavor": EXTRA_CE, "language_id": 25 },
    "r": { "flavor": CE, "language_id": 99 },
    "rb": { "flavor": CE, "language_id": 72 },
    "rs": { "flavor": CE, "language_id": 73 },
    "scala": { "flavor": CE, "language_id": 81 },
    "sh": { "flavor": CE, "language_id": 46 },
    "swift": { "flavor": CE, "language_id": 83 },
    "ts": { "flavor": CE, "language_id": 101 },
    "txt": { "flavor": CE, "language_id": 43 },
};

export function getEditorLanguageMode(languageName) {
    const DEFAULT_EDITOR_LANGUAGE_MODE = "plaintext";
    const LANGUAGE_NAME_TO_LANGUAGE_EDITOR_MODE = {
        "Bash": "shell",
        "C": "c",
        "C3": "c",
        "C#": "csharp",
        "C++": "cpp",
        "Clojure": "clojure",
        "F#": "fsharp",
        "Go": "go",
        "Java": "java",
        "JavaScript": "javascript",
        "Kotlin": "kotlin",
        "Objective-C": "objective-c",
        "Pascal": "pascal",
        "Perl": "perl",
        "PHP": "php",
        "Python": "python",
        "R": "r",
        "Ruby": "ruby",
        "SQL": "sql",
        "Swift": "swift",
        "TypeScript": "typescript",
        "Visual Basic": "vb"
    };

    for (let key in LANGUAGE_NAME_TO_LANGUAGE_EDITOR_MODE) {
        if (languageName.toLowerCase().startsWith(key.toLowerCase())) {
            return LANGUAGE_NAME_TO_LANGUAGE_EDITOR_MODE[key];
        }
    }
    return DEFAULT_EDITOR_LANGUAGE_MODE;
}

export function getLanguageForExtension(extension) {
    return EXTENSIONS_TABLE[extension] || { "flavor": CE, "language_id": 43 };
}
