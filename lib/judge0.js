"use strict";

export const API_KEY = "";

export const AUTH_HEADERS = API_KEY ? {
    "Authorization": `Bearer ${API_KEY}`
} : {};

// Use authenticated URL only when an API key is set; otherwise fall back to public endpoint
export function getSubmitBaseUrl(flavor) {
    return AUTH_HEADERS["Authorization"]
        ? AUTHENTICATED_BASE_URL[flavor]
        : UNAUTHENTICATED_BASE_URL[flavor];
}

export const CE = "CE";
export const EXTRA_CE = "EXTRA_CE";

export const AUTHENTICATED_CE_BASE_URL = "https://judge0-ce.p.sulu.sh";
export const AUTHENTICATED_EXTRA_CE_BASE_URL = "https://judge0-extra-ce.p.sulu.sh";

export const AUTHENTICATED_BASE_URL = {
    [CE]: AUTHENTICATED_CE_BASE_URL,
    [EXTRA_CE]: AUTHENTICATED_EXTRA_CE_BASE_URL,
};

export const UNAUTHENTICATED_CE_BASE_URL = "https://ce.judge0.com";
export const UNAUTHENTICATED_EXTRA_CE_BASE_URL = "https://extra-ce.judge0.com";

export const UNAUTHENTICATED_BASE_URL = {
    [CE]: UNAUTHENTICATED_CE_BASE_URL,
    [EXTRA_CE]: UNAUTHENTICATED_EXTRA_CE_BASE_URL,
};

export const INITIAL_WAIT_TIME_MS = 0;
export const WAIT_TIME_FUNCTION = i => 100;
export const MAX_PROBE_REQUESTS = 50;

export function encode(str) {
    return btoa(unescape(encodeURIComponent(str || "")));
}

export function decode(bytes) {
    var escaped = escape(atob(bytes || ""));
    try {
        return decodeURIComponent(escaped);
    } catch {
        return unescape(escaped);
    }
}
