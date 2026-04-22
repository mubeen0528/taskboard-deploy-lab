from enum import Enum


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in-progress"
    done = "done"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
