from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from Database import init_db, save_report, get_all_reports
from gemini_services import analyze_issue_image

app = FastAPI(title="UrbanIQ API Pipeline")

# Cross-Origin resource configuration for Vercel deployment flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/api/report")
async def report_issue(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        analysis_result = analyze_issue_image(image_bytes)
        save_report(analysis_result)
        return {"status": "success", "data": analysis_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard")
async def get_dashboard_data():
    try:
        reports = get_all_reports()
        total_reports = len(reports)
        severity_stats = {"Low": 0, "Medium": 0, "High": 0}
        
        for r in reports:
            sev = r["severity"].capitalize() if r["severity"] else "Low"
            if sev in severity_stats:
                severity_stats[sev] += 1

        return {
            "total_reports": total_reports,
            "recent_reports": reports,
            "severity_statistics": severity_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))