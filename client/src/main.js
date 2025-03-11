const API_URL = import.meta.env.VITE_API_URL; // Load API URL from env

let currentKey = null;
let isLocked = false;

function accessCode() {
    const button = document.getElementById("accessBtn");
    const key = document.getElementById("codeKey").value.trim();

    if (!key) {
        alert("Please enter a key!");
        return;
    }

    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Loading...`;

    currentKey = key;

    fetchCode().finally(() => {
        button.disabled = false;
        button.innerHTML = "Access Code";
    });
}

function loadHomePage() {
    document.getElementById("app").innerHTML = `
        <div class="container">
            <h1>CodeIt - Quick Notes Storage</h1>
            <form id="submit1">
                <p>Enter your code key</p>
                <input type="text" id="codeKey" placeholder="Enter key">
                <button type="submit" id="accessBtn">Access Code</button>
            </div>
        </div>
        <footer>Several code keys might be used already, if you want to create new notes try a unique key such as <span class="blue">hellotheremaytheforcebewithyou7272</span></footer>
    `;
    isLocked = false;
    // Attach event listener dynamically
    document.getElementById("accessBtn").addEventListener("click", accessCode);
}

function loadCodePage(code) {
    document.getElementById("app").innerHTML = `
        <div class="code-container">
            <h1 id="status">Your Stored Code</h1>
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
    document.getElementById("status").innerHTML= "Your Code Key has been used before!";
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
        document.getElementById("status").innerHTML =  "Your Code Key has never been used before!";
    } else {
        alert("Failed to create new code entry.");
        loadHomePage();
    }
}

async function saveCode() {
    const button = document.getElementById("saveBtn");
    const updatedCode = document.getElementById("codeDisplay").value;

    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Saving...`;

    const response = await fetch(`${API_URL}/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: currentKey, code: updatedCode }),
    });

    button.innerHTML = "Save";
    
    const result = await response.json();
    requestAnimationFrame(() => {
        setTimeout(() => {
            alert(result.success ? "Code saved successfully!" : "Failed to save.");
        }, 0);
    });
    
    button.disabled = false;
}

async function managePassword() {
    const button = document.getElementById("lockBtn");
    const wasLocked = isLocked; 
    const newPassword = prompt(wasLocked ? "Enter new password:" : "Enter a password to lock this code:");

    if (!newPassword) {
        alert("You must enter a password.");
        return;
    }

    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Processing..`;

    const response = await fetch(`${API_URL}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: currentKey, password: newPassword }),
    });

    if (response.ok) {
        const result = await response.json();

        if (result.success) {
            isLocked = true;
            button.innerHTML = "Change Password";
            requestAnimationFrame(() => {
                setTimeout(() => {
                    alert(wasLocked ? "Password changed successfully!" : "Code locked successfully!");
                }, 0);
            });
            loadCodePage(document.getElementById("codeDisplay").value);
            button.disabled = false;
            return;
        }
    }

    button.innerHTML = wasLocked ? "Change Password" : "Lock with Password";
    alert("Failed to update password.");
    button.disabled = false;
}


function showPasswordInput() {
    document.getElementById("app").innerHTML = `
        <div class="container">
            <h1>CodeIt - Quick Code Storage</h1>
            <p>This code is locked. Enter the password:</p>
            <form id="submit2">
                <input type="password" id="codePassword" placeholder="Enter password">
                <button type="submit" id="unlockBtn">Unlock</button>
                <button id="backBtn" class="back-btn">Go Back</button>
            </form>
        </div>
    `;

    document.getElementById("unlockBtn").addEventListener("click", attemptUnlock);
    document.getElementById("backBtn").addEventListener("click", loadHomePage);
}

async function attemptUnlock() {
    const button = document.getElementById("unlockBtn");
    const password = document.getElementById("codePassword").value.trim();
    if (!password) {
        alert("Please enter a password!");
        return;
    }

    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Unlocking...`
    fetchCode(password).finally(() => {
        button.disabled = false;
        button.innerHTML = "Unlock";
    });
}

// Ensure home page loads when the page is first loaded
document.addEventListener("DOMContentLoaded", loadHomePage);
