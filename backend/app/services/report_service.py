"""Report generation service producing JSON, CSV, and HTML reports."""

import csv
import io
import json
from datetime import datetime
from typing import Any, Dict
from sqlalchemy.orm import Session

from backend.app.models.analysis_job import AnalysisJob
from backend.app.models.analysis_result import AnalysisResult


class ReportService:
    """Generates structured analysis reports in JSON, CSV, and HTML formats."""

    @classmethod
    def generate_json_report(cls, db: Session, job_id: int) -> Dict[str, Any]:
        """Generate complete JSON report dictionary."""
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job or not job.result:
            raise ValueError(f"Analysis result for job #{job_id} not available")

        res: AnalysisResult = job.result
        file = job.signal_file

        return {
            "title": "SpectraSync Signal Analysis Report",
            "tagline": "From Raw Recordings to Meaningful Signal Insights",
            "job_id": job.id,
            "generated_at": datetime.utcnow().isoformat(),
            "status": job.status,
            "input_file": {
                "filename": file.filename if file else "unknown",
                "format": file.format if file else "unknown",
                "size_bytes": file.size if file else 0,
                "checksum": file.checksum if file else "unknown",
                "sample_rate": file.sample_rate if file else 0.0
            },
            "primary_modulation": res.primary_modulation,
            "confidence": res.confidence,
            "parameters": res.parameters,
            "modulation_candidates": res.modulation_candidates,
            "synchronization": res.synchronization_data,
            "demodulation": res.demodulation_data,
            "stages": [
                {
                    "stage_name": st.stage_name,
                    "status": st.status,
                    "duration_ms": st.duration_ms,
                    "metrics": st.metrics,
                    "configuration": st.configuration
                }
                for st in job.stages
            ]
        }

    @classmethod
    def generate_csv_parameters(cls, db: Session, job_id: int) -> str:
        """Export estimated parameters as standard CSV."""
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job or not job.result:
            raise ValueError(f"Job #{job_id} not found")

        params = job.result.parameters
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Parameter", "Value", "Unit", "Confidence", "Confidence Label", "Source", "Method", "Uncertainty"])

        for param_name, data in params.items():
            writer.writerow([
                param_name,
                data.get("value"),
                data.get("unit"),
                data.get("confidence"),
                data.get("confidence_label"),
                data.get("source"),
                data.get("method"),
                data.get("uncertainty")
            ])

        return output.getvalue()

    @classmethod
    def generate_html_report(cls, db: Session, job_id: int) -> str:
        """Generate human-readable print-ready HTML report."""
        rep = cls.generate_json_report(db, job_id)
        params = rep["parameters"]
        mods = rep["modulation_candidates"]

        params_rows = "".join(f"""
            <tr>
                <td style="padding:8px;border-bottom:1px solid #334155;font-weight:600;">{k.replace('_', ' ').title()}</td>
                <td style="padding:8px;border-bottom:1px solid #334155;">{v.get('value')} {v.get('unit')}</td>
                <td style="padding:8px;border-bottom:1px solid #334155;"><span style="background:{'#065f46' if v.get('confidence_label')=='High' else '#92400e'};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">{v.get('confidence_label')} ({v.get('confidence')})</span></td>
                <td style="padding:8px;border-bottom:1px solid #334155;font-size:12px;color:#94a3b8;">{v.get('source')}</td>
                <td style="padding:8px;border-bottom:1px solid #334155;font-size:12px;color:#94a3b8;">{v.get('method')} (&plusmn;{v.get('uncertainty')})</td>
            </tr>
        """ for k, v in params.items())

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SpectraSync Analysis Report - Job #{job_id}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; padding: 40px; margin: 0; }}
        .container {{ max-width: 900px; margin: 0 auto; background: #131b2e; padding: 32px; border-radius: 12px; border: 1px solid #1e293b; }}
        h1 {{ color: #38bdf8; margin-top: 0; }}
        .badge {{ background: #0284c7; color: #fff; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 14px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
        th {{ text-align: left; padding: 8px; background: #1e293b; color: #94a3b8; font-size: 12px; text-transform: uppercase; }}
        .footer {{ margin-top: 40px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>SpectraSync Analysis Report</h1>
        <p style="color:#94a3b8;font-size:14px;">From Raw Recordings to Meaningful Signal Insights &bull; Job #{job_id}</p>
        <hr style="border:0;border-top:1px solid #1e293b;margin:20px 0;">

        <h2>1. Executive Summary</h2>
        <p><strong>Primary Classified Modulation:</strong> <span class="badge">{rep['primary_modulation']}</span> (Confidence: {rep['confidence']:.1%})</p>
        <p><strong>Input File:</strong> {rep['input_file']['filename']} ({rep['input_file']['format'].upper()}, {rep['input_file']['size_bytes']} bytes)</p>
        <p><strong>SHA-256 Checksum:</strong> <code style="color:#38bdf8;">{rep['input_file']['checksum']}</code></p>

        <h2>2. Estimated Physical Parameters</h2>
        <table>
            <thead>
                <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Confidence</th>
                    <th>Source</th>
                    <th>Method &amp; Uncertainty</th>
                </tr>
            </thead>
            <tbody>
                {params_rows}
            </tbody>
        </table>

        <h2>3. Provenance &amp; Engineering Principle</h2>
        <p style="font-size:13px;color:#cbd5e1;line-height:1.6;">Every parameter in this report distinguishes between Metadata-derived, DSP-estimated, and ML-predicted sources. In accordance with SpectraSync strict engineering guidelines, unverified values are not forced and are returned with calibrated uncertainties.</p>

        <div class="footer">
            Generated by SpectraSync v1.0.0 &bull; Automated .IQ / .WAV Signal Analysis Platform &bull; {rep['generated_at']}
        </div>
    </div>
</body>
</html>"""
        return html
