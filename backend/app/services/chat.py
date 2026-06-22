from app.schemas import ChatMessage, FindingExplanationResponse
from app.services.openai_responses import StructuredFinding, openai_responses_service


def format_explanation_as_reply(explanation: FindingExplanationResponse) -> str:
    sections = [
        (
            "Consultant summary\n"
            f"Finding: {explanation.finding}\n"
            f"Confidence score: {explanation.confidence_percentage}%\n"
            f"Modality: {explanation.modality}\n"
            f"Location: {explanation.location or 'Not specified by the pipeline'}"
        ),
        f"Professional interpretation\n{explanation.possible_meaning}",
        "General symptoms to review\n" + "\n".join(f"- {item}" for item in explanation.general_symptoms),
        "Questions to ask a physician\n" + "\n".join(f"- {item}" for item in explanation.questions_to_ask_physician),
        "Recommended follow-up\n" + "\n".join(f"- {item}" for item in explanation.recommended_follow_up),
        "Urgent warning signs\n" + "\n".join(f"- {item}" for item in explanation.urgent_warning_signs),
        explanation.disclaimer,
    ]
    return "\n\n".join(sections)


def generate_chat_reply(
    message: str,
    history: list[ChatMessage],
    finding: StructuredFinding,
) -> str:
    explanation = openai_responses_service.explain_finding(
        finding=finding,
        history=history,
        user_question=message,
    )
    return format_explanation_as_reply(explanation)
