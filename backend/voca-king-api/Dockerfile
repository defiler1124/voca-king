# ==============================================================================
# VOCA KING API Dockerfile
# ==============================================================================
# Railway, Render 등 컨테이너 기반 배포용

# 빌드 스테이지
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

# 실행 스테이지
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 타임존 설정
ENV TZ=Asia/Seoul

# JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 포트 노출
EXPOSE 8080

# 실행
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
