from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app import crud, schemas
from app.config import get_cors_origins, get_frontend_static_dir, get_port
from app.database import SessionLocal, init_db
from app.types import TaskPriority, TaskStatus


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="TaskFlow Board API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_: Request, __: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={"detail": "A database error occurred. Please try again."},
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "taskflow-board", "port": get_port()}


@app.get("/tasks", response_model=list[schemas.TaskRead])
def read_tasks(
    search: str | None = Query(default=None, description="Search by title or description"),
    status: TaskStatus | None = Query(default=None),
    priority: TaskPriority | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.list_tasks(db=db, search=search, status=status, priority=priority)


@app.get("/tasks/summary", response_model=schemas.TaskSummary)
def read_task_summary(db: Session = Depends(get_db)):
    return crud.get_summary(db)


@app.post("/tasks", response_model=schemas.TaskRead, status_code=201)
def create_task(task_in: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db=db, task_in=task_in)


@app.put("/tasks/{task_id}", response_model=schemas.TaskRead)
def update_task(task_id: int, task_in: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.update_task(db=db, task=task, task_in=task_in)


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    crud.delete_task(db=db, task=task)
    return None


@app.get("/{path:path}", include_in_schema=False)
def serve_frontend(path: str):
    static_dir = get_frontend_static_dir()
    index_file = static_dir / "index.html"
    static_root = static_dir.resolve()

    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found")

    if path:
        candidate = (static_dir / path).resolve()
        try:
            candidate.relative_to(static_root)
        except ValueError:
            raise HTTPException(status_code=404, detail="File not found")

        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)

    return FileResponse(index_file)
