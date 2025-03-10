const API_URL = import.meta.env.VITE_API_URL; // Load API URL from env

let currentKey = null;
let isLocked = false;

function accessCode() {
    const key = document.getElementById("codeKey").value.trim();
    if (!key) {
        alert("Please enter a key!");
        return;
    }
    currentKey = key;
    fetchCode();
}

function loadHomePage() {
    document.getElementById("app").innerHTML = `
        <div class="container">
            <h1>CodeIt - Quick Notes Storage</h1>
            <div>
                <p>Enter your code key</p>
                <input type="text" id="codeKey" placeholder="Enter key">
                <button id="accessBtn">Access Code</button>
            </div>
        </div>
        <footer>Several code keys might be used already, if you want to create new notes try a unique key such as <span class="blue">hellotheremaytheforcebewithyou7272</span></footer>
    `;

    // Attach event listener dynamically
    document.getElementById("accessBtn").addEventListener("click", accessCode);
}

function loadCodePage(code) {
    document.getElementById("app").innerHTML = `
        <div class="code-container">
            <h1>Your Stored Code</h1>
            <textarea id="codeDisplay">${code}</textarea>
            <div class="btn-group">
                <button id="saveBtn">Save</button>
                <button id="lockBtn">${isLocked ? "Change Password" : "Lock with Password"}</button>
                <button id="backBtn" class="back-btn">Go Back</button>
            </div>
        </div>
    `;

    // Attach event listeners dynamically
    document.getElementById("saveBtn").addEventListener("click", saveCode);
    document.getElementById("lockBtn").addEventListener("click", managePassword);
    document.getElementById("backBtn").addEventListener("click", loadHomePage);
}

async function fetchCode(password = null) {
    const response = await fetch(`${API_URL}/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: currentKey, password }),
    });

    const result = await response.json();

    if (!result.success) {
        if (result.message.includes("Code Locked")) {
            showPasswordInput();
        } else if (result.message.includes("Code not found")) {
            await createNewEntry();
        } else {
            alert(result.message);
            loadHomePage();
        }
        return;
    }

    isLocked = result.is_locked;
    loadCodePage(result.code);
}

async function createNewEntry() {
    const response = await fetch(`${API_URL}/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: currentKey, code: "" }),
    });

    const result = await response.json();
    if (result.success) {
        loadCodePage("");
    } else {
        alert("Failed to create new code entry.");
        loadHomePage();
    }
}

async function saveCode() {
    const updatedCode = document.getElementById("codeDisplay").value;

    const response = await fetch(`${API_URL}/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: currentKey, code: updatedCode }),
    });

    const result = await response.json();
    alert(result.success ? "Code saved successfully!" : "Failed to save.");
}

async function managePassword() {
    const newPassword = prompt(isLocked ? "Enter new password:" : "Enter a password to lock this code:");

    if (!newPassword) {
        alert("You must enter a password.");
        return;
    }

    const response = await fetch(`${API_URL}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: currentKey, password: newPassword }),
    });

    const result = await response.json();
    if (result.success) {
        alert(isLocked ? "Password changed successfully!" : "Code locked successfully!");
        isLocked = true;
        loadCodePage(document.getElementById("codeDisplay").value);
    } else {
        alert("Failed to update password.");
    }
}

function showPasswordInput() {
    document.getElementById("app").innerHTML = `
        <div class="container">
            <h1>CodeIt - Quick Code Storage</h1>
            <p>This code is locked. Enter the password:</p>
            <div>
                <input type="password" id="codePassword" placeholder="Enter password">
                <button id="unlockBtn">Unlock</button>
                <button id="backBtn" class="back-btn">Go Back</button>
            </div>
        </div>
    `;

    document.getElementById("unlockBtn").addEventListener("click", attemptUnlock);
    document.getElementById("backBtn").addEventListener("click", loadHomePage);
}

async function attemptUnlock() {
    const password = document.getElementById("codePassword").value.trim();
    if (!password) {
        alert("Please enter a password!");
        return;
    }
    fetchCode(password);
}

// Ensure home page loads when the page is first loaded
document.addEventListener("DOMContentLoaded", loadHomePage);
