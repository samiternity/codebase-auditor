import time
import logging
import json
from fastapi import Request

logger = logging.getLogger("api_logger")

async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    log_dict = {
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "process_time_ms": round(process_time * 1000, 2),
        "client": request.client.host if request.client else "unknown"
    }
    
    logger.info(json.dumps(log_dict))
    
    return response
