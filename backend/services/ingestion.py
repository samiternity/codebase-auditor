import os
from services.vector_db import QdrantService

IGNORE_DIRS = [".git", "node_modules", "__pycache__", ".venv", "dist", "build"]
IGNORE_EXTS = [".png", ".jpg", ".jpeg", ".pyc", ".db", ".zip", ".tar"]

LOG_QUEUE = []

def log_msg(msg: str):
    print(msg)
    LOG_QUEUE.append(msg)

class IngestionService:

    def file_ignore(self, file_path: str) -> bool:
        for dir in IGNORE_DIRS:
            if dir in file_path:
                return True
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
        log_msg("Scanning directory for files...")
        
        for root, dirs, files in os.walk(repo_path):
            for file in files:
                file_path = os.path.join(root, file)
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
                    continue

        if all_chunks:
            log_msg(f"Upserting {len(all_chunks)} chunks to vector database...")
            qdrant_service.upsert_chunks(all_chunks)
            log_msg("Vector database upsert complete.")
        
    def process_github_repo(self, repo_url: str):
        import subprocess
        import tempfile
        import shutil
        
        temp_dir = tempfile.mkdtemp(prefix="auditor_repo_")
        try:
            log_msg(f"Cloning {repo_url}...")
            subprocess.run(["git", "clone", repo_url, temp_dir], check=True)
            log_msg("Clone successful. Processing directory...")
            try:
                self.process_directory(temp_dir)
            except Exception as e:
                import traceback
                log_msg(f"CRITICAL ERROR in process_directory: {e}")
                log_msg(traceback.format_exc())
            log_msg("Ingestion complete.")
            LOG_QUEUE.append("DONE")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
            log_msg(f"Cleaned up temporary workspace.")
