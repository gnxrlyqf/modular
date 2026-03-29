FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt Pipfile Pipfile.lock .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .
    
RUN python manage.py migrate

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]