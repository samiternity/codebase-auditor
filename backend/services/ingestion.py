import os
from services.vector_db import QdrantService

IGNORE_DIRS = [".git", "node_modules", "__pycache__", ".venv", "dist", "build"]
IGNORE_EXTS = [".png", ".jpg", ".jpeg", ".pyc", ".db", ".zip", ".tar"]

class IngestionService:

    def file_ignore(self, file_path: str) -> bool:

        # check if any ignored directory is in file path
        for dir in IGNORE_DIRS:
            if dir in file_path:
                return True

        # check if file path ends with ignored extension
        for ext in IGNORE_EXTS:
            if file_path.endswith(ext):
                return True
        
        return False

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int=50) -> list[str]:
        if not text or len(text) < chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += (chunk_size - overlap)
        return chunks


    def process_directory(self, repo_path:str):
        qdrant_service = QdrantService()

        qdrant_service.init_collection()
        all_chunks = []

        for root, dirs, files in os.walk(repo_path):
            for file in files:
                file_path = os.path.join(root, file)

                # skip if file_ignore = true
                if self.file_ignore(file_path):
                    continue

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        chunks = self.chunk_text(content)

                        for chunk_str in chunks:
                            chunk_dict = {
                                "text": chunk_str,
                                "file_path": file_path,
                                "chunk_type": "adr" if "adr" in file_path.lower() else "code",
                                "access_level": "public"
                            }
                            all_chunks.append(chunk_dict)

                except Exception:
                    print('file is unreadable')
                    continue

        if all_chunks:
            qdrant_service.upsert_chunks(all_chunks)






        