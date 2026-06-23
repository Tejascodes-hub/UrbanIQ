const API_URL = "https://urbaniq-dbps.onrender.com"; 

document.addEventListener("DOMContentLoaded", () => {
    refreshDashboardTelemetry();

    const form = document.getElementById("upload-form");
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("image-file");

    // Seamless UI/UX Interactivity Elements for Drag Management
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            fileInput.files = files;
        }
    });

    // Automatically submit form if a user drops or selects an item directly via filesystem
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            console.log("File detected path context:", fileInput.files[0].name);
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!fileInput.files.length) return;

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        setProcessingState(true);

        try {
            const res = await fetch(`${API_URL}/api/report`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Processing exception inside data ingestion hub system pipelines.");

            const payload = await res.json();
            renderPremiumAnalysisDisplay(payload.data, fileInput.files[0]);
            refreshDashboardTelemetry();
        } catch (err) {
            alert(`System Ingestion Error: ${err.message}`);
        } finally {
            setProcessingState(false);
        }
    });
});

function setProcessingState(isLoading) {
    const loader = document.getElementById("loader");
    const submitBtn = document.getElementById("submit-btn");
    if (isLoading) {
        loader.classList.remove("hidden");
        submitBtn.disabled = true;
    } else {
        loader.classList.add("hidden");
        submitBtn.disabled = false;
    }
}

function renderPremiumAnalysisDisplay(data, file) {
    const resultCard = document.getElementById("result-card");
    resultCard.classList.remove("hidden-opacity");
    resultCard.classList.add("visible-opacity");

    document.getElementById("preview-img").src = URL.createObjectURL(file);
    document.getElementById("res-type").innerText = data.issue_type;
    
    const severityTarget = document.getElementById("res-severity");
    severityTarget.innerText = data.severity;
    severityTarget.className = `badge badge-${data.severity.toLowerCase()}`;

    document.getElementById("res-impact").innerText = data.impact_score;
    document.getElementById("res-dept").innerText = data.department;
    document.getElementById("res-desc").innerText = data.description;
    document.getElementById("res-action").innerText = data.recommended_action;
}

async function refreshDashboardTelemetry() {
    try {
        const res = await fetch(`${API_URL}/api/dashboard`);
        const stats = await res.json();

        document.getElementById("stat-total").innerText = stats.total_reports;
        document.getElementById("stat-high").innerText = stats.severity_statistics["High"] || 0;

        const reports = stats.recent_reports || [];
        const uniqueDepartments = new Set();
        let totalImpactScore = 0;
        const departmentWorkloads = {};

        reports.forEach(report => {
            if (report.department) {
                uniqueDepartments.add(report.department);
                departmentWorkloads[report.department] = (departmentWorkloads[report.department] || 0) + 1;
            }
            totalImpactScore += Number(report.impact_score || 0);
        });

        document.getElementById("stat-departments").innerText = uniqueDepartments.size;
        
        const computedAvg = reports.length ? (totalImpactScore / reports.length).toFixed(1) : "0.0";
        document.getElementById("stat-avg-severity").innerHTML = `${computedAvg}<span class="metric-unit">/10</span>`;

        renderDepartmentDistributionBars(departmentWorkloads, reports.length);

        const tbody = document.getElementById("logs-table-body");
        tbody.innerHTML = "";

        if (reports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Awaiting inbound sensor telemetry initialization...</td></tr>`;
            return;
        }

        reports.forEach(report => {
            const tr = document.createElement("tr");
            const severityNormalized = report.severity ? report.severity.toLowerCase() : "low";
            
            tr.innerHTML = `
                <td>${report.timestamp || "—"}</td>
                <td style="font-weight:600; color:var(--text-core);">${report.issue_type || "Unclassified"}</td>
                <td><span class="badge badge-${severityNormalized}">${report.severity || "Low"}</span></td>
                <td>${report.department || "Unassigned"}</td>
                <td><strong>${report.impact_score || "0"}/10</strong></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Critical Data Synchronization Stream Fault Event: ", e);
    }
}

function renderDepartmentDistributionBars(workloads, totalCount) {
    const container = document.getElementById("department-bar-grid");
    container.innerHTML = "";

    const entries = Object.entries(workloads);
    if (!entries.length) {
        container.innerHTML = `<p class="empty-state">Awaiting asset database pipeline data...</p>`;
        return;
    }

    entries.sort((a, b) => b[1] - a[1]).forEach(([dept, count]) => {
        const percentage = totalCount ? ((count / totalCount) * 100).toFixed(0) : 0;
        const row = document.createElement("div");
        row.className = "chart-row";
        row.innerHTML = `
            <div class="chart-label-space">
                <span>${dept}</span>
                <span class="chart-count-pill">${count} reports (${percentage}%)</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        container.appendChild(row);
    });
}