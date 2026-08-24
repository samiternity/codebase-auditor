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

        prompt = f"""Task: Audit PR diff against Codebase Rules.
Rules:
{context_string}

PR Diff:
{pr_code}

Output strictly JSON:
{{"status":"pass"|"fail","score":0-100,"violations":["brief description"],"suggested_fix":"concise fix"}}"""
        response = completion(
            model="gemini/gemini-1.5-flash", 
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )

        raw_json_string = response.choices[0].message.content
        
        return json.loads(raw_json_string)

