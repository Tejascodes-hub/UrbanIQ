const API_URL = "https://urbaniq-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    refreshDashboard();

    const form = document.getElementById("upload-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById("image-file");
        if (!fileInput.files.length) return;

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        setLoadingState(true);

        try {
            const res = await fetch(`${API_URL}/api/report`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Analysis sequence failed.");

            const json = await res.getJson = await res.json();
            renderLiveResult(json.data, fileInput.files[0]);
            refreshDashboard();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoadingState(false);
        }
    });
});

function setLoadingState(isLoading) {
    document.getElementById("loader").classList.toggle("hidden", !isLoading);
    document.getElementById("submit-btn").disabled = isLoading;
}

function renderLiveResult(data, file) {
    document.getElementById("result-card").classList.remove("hidden");
    document.getElementById("preview-img").src = URL.createObjectURL(file);
    
    document.getElementById("res-type").innerText = data.issue_type;
    document.getElementById("res-severity").innerText = data.severity;
    document.getElementById("res-impact").innerText = data.impact_score;
    document.getElementById("res-dept").innerText = data.department;
    document.getElementById("res-desc").innerText = data.description;
    document.getElementById("res-action").innerText = data.recommended_action;
}

async function refreshDashboard() {
    try {
        const res = await fetch(`${API_URL}/api/dashboard`);
        const stats = await res.json();

        document.getElementById("stat-total").innerText = stats.total_reports;
        document.getElementById("stat-high").innerText = stats.severity_statistics["High"] || 0;

        const tbody = document.getElementById("logs-table-body");
        tbody.innerHTML = "";

        stats.recent_reports.forEach(report => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${report.timestamp}</td>
                <td>${report.issue_type}</td>
                <td><strong>${report.severity}</strong></td>
                <td>${report.department}</td>
                <td>${report.impact_score}/10</td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        console.error("Dashboard error sync:", e);
    }
}