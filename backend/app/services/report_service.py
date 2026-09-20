"""Report generation service producing JSON, CSV, HTML, and vector PDF reports."""

import csv
import io
import json
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy.orm import Session

from backend.app.models.analysis_job import AnalysisJob
from backend.app.models.analysis_result import AnalysisResult

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


class NumberedCanvas:
    """Canvas wrapper that records total pages and prints running footer."""
    def __init__(self, *args, **kwargs):
        from reportlab.pdfgen import canvas
        self.canvas_class = canvas.Canvas

    def __call__(self, *args, **kwargs):
        canvas_obj = self.canvas_class(*args, **kwargs)
        orig_showPage = canvas_obj.showPage
        orig_save = canvas_obj.save
        page_states = []

        def showPage():
            page_states.append(dict(canvas_obj.__dict__))
            canvas_obj._startPage()

        def save():
            num_pages = len(page_states)
            for state in page_states:
                canvas_obj.__dict__.update(state)
                # Draw footer
                canvas_obj.saveState()
                canvas_obj.setFont("Helvetica", 8)
                canvas_obj.setFillColor(colors.HexColor("#64748b"))
                canvas_obj.setStrokeColor(colors.HexColor("#cbd5e1"))
                canvas_obj.setLineWidth(0.5)
                canvas_obj.line(36, 32, 576, 32)
                canvas_obj.drawString(36, 22, "SpectraSync v1.0.0 • Automated .IQ / .WAV Signal Analysis Platform • Official Report")
                page_text = f"Page {canvas_obj._pageNumber} of {num_pages}"
                canvas_obj.drawRightString(576, 22, page_text)
                canvas_obj.restoreState()
                orig_showPage()
            orig_save()

        canvas_obj.showPage = showPage
        canvas_obj.save = save
        return canvas_obj


class ReportService:
    """Generates structured analysis reports in JSON, CSV, HTML, and PDF formats."""

    @classmethod
    def generate_json_report(cls, db: Session, job_id: int) -> Dict[str, Any]:
        """Generate complete JSON report dictionary."""
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job or not job.result:
            raise ValueError(f"Analysis result for job #{job_id} not available")

        res: AnalysisResult = job.result
        file = job.signal_file
        bitstream = job.bitstream

        return {
            "title": "SpectraSync Signal Analysis Report",
            "tagline": "From Raw Recordings to Meaningful Signal Insights",
            "job_id": job.id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
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
            "bitstream": {
                "length": bitstream.length if bitstream else 0,
                "correlation_score": bitstream.correlation_score if bitstream else 0.0,
                "header_offsets": bitstream.header_offsets if bitstream else [],
                "hex_preview": (bitstream.hex_stream[:128] + "...") if bitstream and bitstream.hex_stream else "",
                "bit_density": bitstream.bit_density if bitstream else 0.0
            },
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

    @classmethod
    def generate_pdf_report(cls, db: Session, job_id: int) -> bytes:
        """Generate publication-quality vector PDF report using ReportLab."""
        rep = cls.generate_json_report(db, job_id)
        file_meta = rep["input_file"]
        params = rep.get("parameters", {})
        candidates = rep.get("modulation_candidates", [])
        demod = rep.get("demodulation", {})
        bitstream = rep.get("bitstream", {})
        stages = rep.get("stages", [])

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=45
        )

        styles = getSampleStyleSheet()

        # Custom Typography Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a")
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b")
        )
        h2_style = ParagraphStyle(
            "Heading2Custom",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "BodyCustom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#334155")
        )
        mono_style = ParagraphStyle(
            "MonoCustom",
            parent=styles["Normal"],
            fontName="Courier",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0369a1")
        )
        tbl_header_style = ParagraphStyle(
            "TblHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white
        )
        tbl_cell_style = ParagraphStyle(
            "TblCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1e293b")
        )
        tbl_cell_bold = ParagraphStyle(
            "TblCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0f172a")
        )

        elements = []

        # Header Block
        elements.append(Paragraph("SpectraSync Signal Analysis Report", title_style))
        elements.append(Paragraph(
            f"Automated .IQ / .WAV Signal Analysis Platform &bull; Job #{job_id} &bull; Generated {rep['generated_at'][:19].replace('T', ' ')} UTC",
            subtitle_style
        ))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=10))

        # Executive Summary & Modulation Callout
        summary_data = [
            [
                Paragraph("<b>Signal File:</b>", tbl_cell_style),
                Paragraph(f"{file_meta['filename']} ({file_meta['format'].upper()}, {file_meta['size_bytes']:,} bytes)", tbl_cell_style),
                Paragraph("<b>Primary Modulation:</b>", tbl_cell_style),
                Paragraph(f"<font color='#0284c7'><b>{rep['primary_modulation']}</b></font> ({rep['confidence']:.1%})", tbl_cell_style),
            ],
            [
                Paragraph("<b>SHA-256 Checksum:</b>", tbl_cell_style),
                Paragraph(f"<font face='Courier' size='7'>{file_meta['checksum']}</font>", tbl_cell_style),
                Paragraph("<b>Overall Status:</b>", tbl_cell_style),
                Paragraph(f"<b>{rep['status'].upper()}</b>", tbl_cell_style),
            ]
        ]
        sum_table = Table(summary_data, colWidths=[110, 200, 110, 120])
        sum_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(sum_table)
        elements.append(Spacer(1, 10))

        # 1. Estimated Physical Parameters
        elements.append(Paragraph("1. Estimated Physical Parameters (with Provenance)", h2_style))
        param_rows = [[
            Paragraph("Parameter", tbl_header_style),
            Paragraph("Value & Unit", tbl_header_style),
            Paragraph("Confidence", tbl_header_style),
            Paragraph("Source", tbl_header_style),
            Paragraph("Method & Uncertainty", tbl_header_style),
        ]]

        for k, v in params.items():
            conf_lbl = v.get("confidence_label", "Medium")
            badge_color = "#059669" if conf_lbl == "High" else ("#d97706" if conf_lbl == "Medium" else "#dc2626")
            param_rows.append([
                Paragraph(k.replace("_", " ").title(), tbl_cell_bold),
                Paragraph(f"<b>{v.get('value')}</b> {v.get('unit')}", tbl_cell_style),
                Paragraph(f"<font color='{badge_color}'><b>{conf_lbl}</b> ({v.get('confidence')})</font>", tbl_cell_style),
                Paragraph(v.get("source", "DSP"), tbl_cell_style),
                Paragraph(f"{v.get('method', '')} (&plusmn;{v.get('uncertainty', '')})", tbl_cell_style),
            ])

        param_table = Table(param_rows, colWidths=[120, 95, 85, 95, 145])
        param_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        elements.append(param_table)
        elements.append(Spacer(1, 10))

        # 2. Modulation Classification Probabilities
        elements.append(Paragraph("2. Modulation Classification Distribution", h2_style))
        mod_rows = [[
            Paragraph("Modulation Candidate", tbl_header_style),
            Paragraph("Confidence Score", tbl_header_style),
            Paragraph("Detection Basis", tbl_header_style),
        ]]
        for cand in candidates[:6]:
            mod_rows.append([
                Paragraph(cand.get("modulation", "UNKNOWN"), tbl_cell_bold),
                Paragraph(f"{cand.get('confidence', 0.0):.1%}", tbl_cell_style),
                Paragraph("Higher-order cumulants + Random Forest classifier", tbl_cell_style),
            ])
        mod_table = Table(mod_rows, colWidths=[150, 110, 280])
        mod_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        elements.append(mod_table)
        elements.append(Spacer(1, 10))

        # 3. Demodulation, Bit Stream & Correlation
        elements.append(Paragraph("3. Demodulation, Recovered Bit Stream & Correlation", h2_style))
        demod_rows = [
            [
                Paragraph("<b>Demodulator Type:</b>", tbl_cell_style),
                Paragraph(str(demod.get("modulation", rep['primary_modulation'])), tbl_cell_style),
                Paragraph("<b>Recovered Bits:</b>", tbl_cell_style),
                Paragraph(f"{bitstream.get('length', demod.get('bit_count', 0)):,} bits", tbl_cell_style),
            ],
            [
                Paragraph("<b>Estimated Bit Rate:</b>", tbl_cell_style),
                Paragraph(f"{demod.get('bit_rate_bps', 0):,} bps", tbl_cell_style),
                Paragraph("<b>Bit Density (ones ratio):</b>", tbl_cell_style),
                Paragraph(f"{bitstream.get('bit_density', 0.5):.3f}", tbl_cell_style),
            ],
            [
                Paragraph("<b>Correlation Peak Score:</b>", tbl_cell_style),
                Paragraph(f"{bitstream.get('correlation_score', 0.0):.4f}", tbl_cell_style),
                Paragraph("<b>Detected Headers:</b>", tbl_cell_style),
                Paragraph(f"{len(bitstream.get('header_offsets', []))} frame boundary markers", tbl_cell_style),
            ],
            [
                Paragraph("<b>Hex Stream Excerpt:</b>", tbl_cell_style),
                Paragraph(f"<font face='Courier' size='7'>{bitstream.get('hex_preview', 'N/A')}</font>", tbl_cell_style),
                Paragraph("<b>Channel BER Estimate:</b>", tbl_cell_style),
                Paragraph(str(demod.get("ber") or "N/A"), tbl_cell_style),
            ]
        ]
        demod_table = Table(demod_rows, colWidths=[130, 140, 130, 140])
        demod_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(demod_table)
        elements.append(Spacer(1, 10))

        # 4. Pipeline Execution Telemetry
        elements.append(Paragraph("4. Pipeline Stage Execution Telemetry", h2_style))
        stage_rows = [[
            Paragraph("Stage Name", tbl_header_style),
            Paragraph("Status", tbl_header_style),
            Paragraph("Duration (ms)", tbl_header_style),
            Paragraph("Metrics Summary", tbl_header_style),
        ]]
        for st in stages:
            st_color = "#059669" if st.get("status") == "completed" else "#dc2626"
            metrics_str = ", ".join(f"{k}={v}" for k, v in list(st.get("metrics", {}).items())[:2]) if st.get("metrics") else "—"
            stage_rows.append([
                Paragraph(st.get("stage_name", "").replace("_", " ").title(), tbl_cell_bold),
                Paragraph(f"<font color='{st_color}'><b>{st.get('status', '').upper()}</b></font>", tbl_cell_style),
                Paragraph(f"{st.get('duration_ms', 0.0):.2f}", tbl_cell_style),
                Paragraph(metrics_str, tbl_cell_style),
            ])

        stage_table = Table(stage_rows, colWidths=[140, 80, 80, 240])
        stage_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        elements.append(stage_table)
        elements.append(Spacer(1, 10))

        # Provenance Statement
        elements.append(Paragraph(
            "<b>Engineering Provenance Note:</b> In accordance with SIH26147 specifications, all estimated signal "
            "attributes distinguish metadata assertions from statistical DSP estimations and machine-learning predictions. "
            "Uncertainties are calibrated and reflect detector confidence bounds.",
            body_style
        ))

        # Build PDF with dynamic NumberedCanvas for header/footer and page numbering
        doc.build(elements, canvasmaker=NumberedCanvas())
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
