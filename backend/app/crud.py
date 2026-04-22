from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Task
from app.schemas import TaskCreate, TaskUpdate
from app.types import TaskPriority, TaskStatus


def create_task(db: Session, task_in: TaskCreate) -> Task:
    task = Task(**task_in.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks(
    db: Session,
    search: str | None = None,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
) -> list[Task]:
    stmt = select(Task)

    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Task.title.ilike(term),
                func.coalesce(Task.description, "").ilike(term),
            )
        )

    if status:
        stmt = stmt.where(Task.status == status)

    if priority:
        stmt = stmt.where(Task.priority == priority)

    stmt = stmt.order_by(Task.updated_at.desc(), Task.id.desc())
    return list(db.scalars(stmt).all())


def get_task(db: Session, task_id: int) -> Task | None:
    return db.get(Task, task_id)


def update_task(db: Session, task: Task, task_in: TaskUpdate) -> Task:
    updates = task_in.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def get_summary(db: Session) -> dict[str, int]:
    total = db.scalar(select(func.count(Task.id))) or 0
    grouped = dict(
        db.execute(
            select(Task.status, func.count(Task.id)).group_by(Task.status)
        ).all()
    )

    return {
        "total": total,
        "todo": int(grouped.get(TaskStatus.todo, 0)),
        "in_progress": int(grouped.get(TaskStatus.in_progress, 0)),
        "done": int(grouped.get(TaskStatus.done, 0)),
    }
