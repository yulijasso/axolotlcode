"use strict";

export const IS_PUTER = typeof puter !== "undefined" && puter.env === "app";

export function usePuter() {
    return IS_PUTER || (typeof puter !== "undefined" && puter.auth.isSignedIn());
}

export async function uiSignIn() {
    document.getElementById("judge0-sign-in-btn").classList.add("judge0-hidden");
    const signOutBtn = document.getElementById("judge0-sign-out-btn");
    signOutBtn.classList.remove("judge0-hidden");
    signOutBtn.querySelector("#judge0-puter-username").innerText = (await puter.auth.getUser()).username;

    const modelSelect = document.getElementById("judge0-chat-model-select");
    modelSelect.closest(".ui.selection.dropdown").classList.remove("disabled");

    const userInput = document.getElementById("judge0-chat-user-input");
    userInput.disabled = false;
    userInput.placeholder = `Message ${modelSelect.value}`;

    document.getElementById("judge0-chat-send-button").disabled = false;
    document.getElementById("judge0-inline-suggestions").disabled = false;
}

export function uiSignOut() {
    document.getElementById("judge0-sign-in-btn").classList.remove("judge0-hidden");
    const signOutBtn = document.getElementById("judge0-sign-out-btn");
    signOutBtn.classList.add("judge0-hidden");
    signOutBtn.querySelector("#judge0-puter-username").innerText = "Sign out";

    const modelSelect = document.getElementById("judge0-chat-model-select");
    modelSelect.closest(".ui.selection.dropdown").classList.add("disabled");

    const userInput = document.getElementById("judge0-chat-user-input");
    userInput.disabled = true;
    userInput.placeholder = `Sign in to chat with ${modelSelect.value}`;

    document.getElementById("judge0-chat-send-button").disabled = true;
    document.getElementById("judge0-inline-suggestions").disabled = true;
}

export function updateSignInUI() {
    if (typeof puter !== "undefined" && puter.auth.isSignedIn()) {
        uiSignIn();
    } else {
        uiSignOut();
    }
}

export async function signIn() {
    await puter.auth.signIn();
    updateSignInUI();
}

export function signOut() {
    puter.auth.signOut();
    updateSignInUI();
}
