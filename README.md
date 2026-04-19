# StyleStore

🛍️  Fashion e-commerce application.

## Main Features
- 🧾 Browse & search products (pagination, category filtering)
- 🔍 Product details, sizes & stock
- 🙍‍♀️ Authentication (login/register with token), customer & admin pages
- 🛒 Shopping cart & orders & promotion (UI ready, API hooks extensible)
- 💬 Realtime support chat between customer and admin

## Technologies
- ☕ Backend: Spring Boot (Java 17), Spring Security + OAuth2, JPA/Hibernate, Maven
- 🧰 Infra/Cache: Redis ready for caching/session
- 🔌 Realtime: WebSocket + STOMP + SockJS
- ⚛️ Frontend: React 18, Vite, TypeScript, TailwindCSS, Lucide icons


## Structure
- `StyleStore_BE/` – Spring Boot API
- `StyleStore_FE/` – React/Vite UI
- `StyleStore_AI/` – Python FastAPI + LangChain RAG service for product consultation

## Quick Start
- Backend: `cd StyleStore_BE && ./mvnw spring-boot:run` 
- Frontend: `cd StyleStore_FE && npm install && npm run dev`

