import json
import os
import threading
from datetime import datetime, timezone

LOG_FILE = os.environ.get('LOG_FILE_PATH', '/app/logs/app.log')

_lock = threading.Lock()


def write_log(*, user=None, level='info', message='', context=None, source='frontend'):
    entry = {
        'user': user,
        'level': level,
        'message': message,
        'context': context,
        'source': source,
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        with open(LOG_FILE, 'a') as f:
            f.write(json.dumps(entry) + '\n')
