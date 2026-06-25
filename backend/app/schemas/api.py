from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterRequest(AuthRequest):
    name: str = Field(min_length=2, max_length=160)


class GoogleAuthRequest(BaseModel):
    credential: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UploadResponse(BaseModel):
    upload_id: str
    image_url: str


class BatchUploadItemResponse(BaseModel):
    upload_id: str
    image_url: str
    filename: str


class BatchUploadResponse(BaseModel):
    uploads: list[BatchUploadItemResponse]


class PredictRequest(BaseModel):
    upload_id: str


class BatchPredictRequest(BaseModel):
    upload_ids: list[str] = Field(min_length=1)


class BoundingBoxResponse(BaseModel):
    label: str
    confidence: float
    x_min: int
    y_min: int
    x_max: int
    y_max: int


class AnalysisResponse(BaseModel):
    id: str
    image_url: str
    overlay_url: str
    annotated_image_url: str
    segmentation_mask_urls: list[str]
    bounding_boxes: list[BoundingBoxResponse]
    prediction: str
    confidence: float
    modality: str
    explanation: str
    engine: dict[str, str]
    created_at: datetime


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    analysis_id: str | None = None
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


class MemoryClearResponse(BaseModel):
    cleared_analyses: int
    cleared_chat_messages: int
    deleted_files: int
    cleared_pending_uploads: int


class AdminUserRow(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    analysis_count: int
    last_active: datetime | None = None


class AdminOverviewResponse(BaseModel):
    total_users: int
    total_analyses: int
    total_chat_messages: int
    users: list[AdminUserRow]


class FindingExplanationResponse(BaseModel):
    finding: str
    confidence_percentage: int
    modality: str
    location: str | None = None
    possible_meaning: str
    general_symptoms: list[str]
    questions_to_ask_physician: list[str]
    recommended_follow_up: list[str]
    urgent_warning_signs: list[str]
    disclaimer: str
