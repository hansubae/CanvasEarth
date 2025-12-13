#!/bin/bash

# CanvasEarth GCP 배포 스크립트
# 이 스크립트는 GCP VM에서 실행됩니다.

set -e

echo "🚀 CanvasEarth 배포 시작..."

# 1. 환경 변수 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다. .env.example을 복사하여 .env를 생성하세요."
    exit 1
fi

# 2. Docker가 실행 중인지 확인
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker가 실행 중이지 않습니다. Docker를 시작하세요."
    exit 1
fi

# 3. 이전 컨테이너 중지 및 제거
echo "🛑 기존 컨테이너 중지 중..."
docker compose down

# 4. 빌드 및 시작
echo "🔨 컨테이너 빌드 및 시작 중..."
docker compose up -d --build

# 5. 상태 확인
echo "✅ 컨테이너 상태 확인 중..."
sleep 5
docker compose ps

# 6. 로그 출력
echo ""
echo "📋 최근 로그:"
docker compose logs --tail=20

echo ""
echo "✨ 배포 완료!"
echo ""
echo "📍 접속 정보:"
echo "   Frontend: http://$(curl -s ifconfig.me):5173"
echo "   Backend:  http://$(curl -s ifconfig.me):8080"
echo ""
echo "📊 로그 확인: docker compose logs -f"
echo "🔄 재시작:   docker compose restart"
echo "🛑 중지:     docker compose down"
