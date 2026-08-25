import os
from qdrant_client import QdrantClient, models
from qdrant_client.models import VectorParams, Distance
from litellm import embedding
import uuid

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(
            host=os.getenv("QDRANT_HOST", "qdrant"),
            port=int(os.getenv("QDRANT_PORT", 6333))
            )

        self.collection_name = "codebase_chunks"

    def init_collection(self):
        exists = False
        try:
            exists = self.client.collection_exists(collection_name=self.collection_name)
        except Exception:
            exists = False

        if not exists:
            self.client.create_collection(
                collection_name="codebase_chunks",
                vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
            )

    def upsert_chunks(self, chunks:list[dict]):
        points = []

        for chunk in chunks:
            vector = get_embedding(chunk['text'])
            point = models.PointStruct(
            id=str(uuid.uuid4()), 
            vector=vector, 
            payload=chunk)
            points.append(point)

        self.client.upsert(
            collection_name = self.collection_name,
            points=points
        )

    def search_chunks(self, query: str, limit: int = 5):
        vector = get_embedding(query)

        search_results = self.client.search(
            collection_name = self.collection_name,
            query_vector = vector,
            limit = limit
        )

        return search_results


def get_embedding(text: str) -> list[float]:

    response = embedding(model='gemini/text-embedding-004', input=text)
    return response.data[0]['embedding']
