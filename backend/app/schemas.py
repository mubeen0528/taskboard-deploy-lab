from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.types import TaskPriority, TaskStatus


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class TaskSummary(BaseModel):
    total: int
    todo: int
    in_progress: int
    done: int
