import json
from litellm import completion
from services.vector_db import QdrantService

class AuditEngine:
    def __init__(self):
        self.qdrant = QdrantService()

    def audit_pr(self, pr_code: str) -> dict:

        # search for pr code
        search_results = self.qdrant.search_chunks(query=pr_code, limit=3)

        context_string = "\n\n".join([point.payload["text"] for point in search_results])

        prompt = f"""
You are an expert Senior Code Auditor. Review the following PR Code against the provided Codebase Context (which contains our rules and ADRs).

CODEBASE CONTEXT:
{context_string}

NEW PR CODE:
{pr_code}

Respond in strict JSON format exactly like this:
{{
    "status": "pass" or "fail",
    "score": <float between 0 and 100>,
    "violations": ["list of rule violations if any"],
    "suggested_fix": "description of how to fix the code"
}}
"""
        response = completion(
            model="gemini/gemini-1.5-flash", 
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )

        raw_json_string = response.choices[0].message.content
        
        return json.loads(raw_json_string)

