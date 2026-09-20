"""Signal file upload and retrieval API router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.signal_file import SignalFile
from backend.app.schemas.file import FileUploadResponse, SignalFileOut
from backend.app.services.file_service import FileService
from backend.app.services.storage_service import storage_service

router = APIRouter(prefix="/files", tags=["files"], dependencies=[Depends(get_current_user)])


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    sample_rate: Optional[float] = Form(None),
    center_frequency: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload raw .IQ or .WAV recording, validate, and extract metadata."""
    content = await file.read()
    try:
        db_file = FileService.upload_file(
            db,
            filename=file.filename,
            content=content,
            sample_rate_override=sample_rate,
            center_frequency_override=center_frequency
        )
        return FileUploadResponse(
            file=db_file,
            validation_status="valid",
            warnings=[]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[SignalFileOut])
def list_files(db: Session = Depends(get_db)):
    """List all ingested signal files."""
    return db.query(SignalFile).order_by(SignalFile.uploaded_at.desc()).all()


@router.get("/{file_id}", response_model=SignalFileOut)
def get_file(file_id: int, db: Session = Depends(get_db)):
    """Retrieve metadata for a specific signal file."""
    f = db.query(SignalFile).filter(SignalFile.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Signal file not found")
    return f


@router.get("/{file_id}/content")
def download_file_content(file_id: int, db: Session = Depends(get_db)):
    """Stream raw file content from storage."""
    f = db.query(SignalFile).filter(SignalFile.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Signal file not found")

    abs_path = storage_service.get_file_path(f.storage_path)
    if not abs_path.is_file():
        raise HTTPException(status_code=404, detail="File missing on storage")

    return FileResponse(path=str(abs_path), filename=f.filename, media_type="application/octet-stream")


@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    """Delete a signal file and its storage artifacts."""
    f = db.query(SignalFile).filter(SignalFile.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Signal file not found")

    storage_service.delete_file(f.storage_path)
    db.delete(f)
    db.commit()
    return {"message": "File deleted successfully"}
