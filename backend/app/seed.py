from sqlalchemy import select

from app.database import SessionLocal, init_db
from app.models import Task
from app.schemas import TaskCreate
from app.crud import create_task
from app.types import TaskPriority, TaskStatus


def seed_database() -> None:
    init_db()

    with SessionLocal() as db:
        existing = db.scalar(select(Task.id))
        if existing is not None:
            print("Database already has tasks. Seed skipped.")
            return

        sample_tasks = [
            TaskCreate(
                title="Design the task board layout",
                description="Create a clean card-based layout with filters and summary cards.",
                status=TaskStatus.todo,
                priority=TaskPriority.high,
            ),
            TaskCreate(
                title="Build the FastAPI CRUD endpoints",
                description="Implement task creation, editing, deletion, filtering, and summaries.",
                status=TaskStatus.in_progress,
                priority=TaskPriority.high,
            ),
            TaskCreate(
                title="Add loading and empty states",
                description="Make the UI feel polished when data is loading or no tasks match.",
                status=TaskStatus.todo,
                priority=TaskPriority.medium,
            ),
            TaskCreate(
                title="Write deployment notes",
                description="Document local Docker setup, production Docker build, and GitHub push steps.",
                status=TaskStatus.done,
                priority=TaskPriority.low,
            ),
        ]

        for task in sample_tasks:
            create_task(db, task)

        print("Seeded sample tasks successfully.")


if __name__ == "__main__":
    seed_database()
