import json
from dataclasses import dataclass

import requests
from fastapi import HTTPException

from app.core.config import settings
from app.schemas import ChatMessage, FindingExplanationResponse

MEDICAL_DISCLAIMER = "AI output is not a medical diagnosis. A licensed physician must interpret imaging findings."


@dataclass(frozen=True)
class StructuredFinding:
    finding: str
    confidence: float
    modality: str
    location: str | None = None
    pipeline_explanation: str | None = None

    @property
    def confidence_percentage(self) -> int:
        bounded = min(max(self.confidence, 0.0), 1.0)
        return round(bounded * 100)


def _default_explanation(finding: StructuredFinding) -> FindingExplanationResponse:
    location_text = finding.location or "No anatomical location was supplied by the pipeline."
    return FindingExplanationResponse(
        finding=finding.finding,
        confidence_percentage=finding.confidence_percentage,
        modality=finding.modality,
        location=finding.location,
        possible_meaning=(
            f"The pipeline flagged '{finding.finding}' as a research finding for {finding.modality}. "
            f"Location detail: {location_text}"
        ),
        general_symptoms=[
            "Symptoms depend on the underlying condition and may be absent.",
            "Only a clinician can relate symptoms, history, and imaging together."
        ],
        questions_to_ask_physician=[
            "What conditions could produce this kind of imaging finding?",
            "What additional tests or specialist review would clarify the result?",
            "How should this finding be interpreted with the patient's symptoms and history?"
        ],
        recommended_follow_up=[
            "Review the full study with a radiologist or treating physician.",
            "Use validated clinical workflows and, if appropriate, confirmatory imaging or laboratory work."
        ],
        urgent_warning_signs=[
            "Rapidly worsening pain",
            "New weakness, numbness, or difficulty walking",
            "Loss of bowel or bladder control",
            "Severe shortness of breath, chest pain, or sudden confusion"
        ],
        disclaimer=MEDICAL_DISCLAIMER,
    )


def _extract_text(payload: dict) -> str:
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    for item in payload.get("output", []):
        for content in item.get("content", []):
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text

    raise HTTPException(status_code=502, detail="OpenAI response did not include text output")


class OpenAIResponsesService:
    def explain_finding(
        self,
        finding: StructuredFinding,
        history: list[ChatMessage] | None = None,
        user_question: str | None = None,
    ) -> FindingExplanationResponse:
        if not settings.openai_api_key:
            return self._fallback_consultation(finding, user_question)

        history_lines = []
        for message in history or []:
            history_lines.append(f"{message.role.title()}: {message.content}")
        conversation_history = "\n".join(history_lines) if history_lines else "No prior chat history."

        prompt = {
            "task": "Explain structured medical-imaging findings in a professional, plain-language consultant style without diagnosing.",
            "rules": [
                "Never diagnose, confirm cancer, or interpret raw images.",
                "Only discuss the structured finding fields provided below.",
                "Be careful and non-alarmist. Use words like possible, may, or can.",
                "Write in a professional and well-organized tone suitable for a research consultation summary.",
                "Include symptoms as general possibilities, not as confirmed patient symptoms.",
                "Recommend physician follow-up and mention urgent warning signs that need prompt medical care.",
                f"Always include this exact disclaimer: {MEDICAL_DISCLAIMER}",
                "Return valid JSON only with keys: possible_meaning, general_symptoms, questions_to_ask_physician, recommended_follow_up, urgent_warning_signs, disclaimer."
            ],
            "structured_finding": {
                "finding": finding.finding,
                "confidence_percentage": finding.confidence_percentage,
                "modality": finding.modality,
                "location": finding.location or "Not provided by the pipeline",
                "pipeline_explanation": finding.pipeline_explanation or "Not provided by the pipeline",
            },
            "user_question": user_question or "Explain this finding using the required sections.",
            "conversation_history": conversation_history,
        }

        response = requests.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_model,
                "input": [
                    {
                        "role": "developer",
                        "content": [
                            {
                                "type": "input_text",
                                "text": "You are a medical research explainer. You must never diagnose, never claim certainty from imaging, and never say you reviewed an image.",
                            }
                        ],
                    },
                    {
                        "role": "user",
                        "content": [{"type": "input_text", "text": json.dumps(prompt)}],
                    },
                ],
            },
            timeout=settings.openai_timeout_seconds,
        )
        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            del exc
            return self._fallback_consultation(finding, user_question)

        raw_text = _extract_text(response.json())
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            return self._fallback_consultation(finding, user_question)

        return FindingExplanationResponse(
            finding=finding.finding,
            confidence_percentage=finding.confidence_percentage,
            modality=finding.modality,
            location=finding.location,
            possible_meaning=str(parsed.get("possible_meaning") or _default_explanation(finding).possible_meaning),
            general_symptoms=[str(item) for item in parsed.get("general_symptoms", [])] or _default_explanation(finding).general_symptoms,
            questions_to_ask_physician=[str(item) for item in parsed.get("questions_to_ask_physician", [])]
            or _default_explanation(finding).questions_to_ask_physician,
            recommended_follow_up=[str(item) for item in parsed.get("recommended_follow_up", [])]
            or _default_explanation(finding).recommended_follow_up,
            urgent_warning_signs=[str(item) for item in parsed.get("urgent_warning_signs", [])]
            or _default_explanation(finding).urgent_warning_signs,
            disclaimer=str(parsed.get("disclaimer") or MEDICAL_DISCLAIMER),
        )

    def _fallback_consultation(self, finding: StructuredFinding, user_question: str | None = None) -> FindingExplanationResponse:
        explanation = _default_explanation(finding)
        if not user_question:
            return explanation

        question = user_question.lower()
        possible_meaning = explanation.possible_meaning
        follow_up = list(explanation.recommended_follow_up)
        symptoms = list(explanation.general_symptoms)

        if "confidence" in question or "percent" in question or "%" in question:
            possible_meaning += (
                f" The current pipeline confidence is {finding.confidence_percentage}%, which is only a research score and not a probability of diagnosis."
            )
        if "symptom" in question or "feel" in question:
            symptoms.append("A physician can determine whether any symptoms are actually related to this imaging finding.")
        if "next" in question or "follow" in question or "doctor" in question:
            follow_up.append("Bring the exported text report and annotated image to the clinician review if useful.")

        return FindingExplanationResponse(
            finding=explanation.finding,
            confidence_percentage=explanation.confidence_percentage,
            modality=explanation.modality,
            location=explanation.location,
            possible_meaning=possible_meaning,
            general_symptoms=symptoms,
            questions_to_ask_physician=explanation.questions_to_ask_physician,
            recommended_follow_up=follow_up,
            urgent_warning_signs=explanation.urgent_warning_signs,
            disclaimer=explanation.disclaimer,
        )


openai_responses_service = OpenAIResponsesService()
