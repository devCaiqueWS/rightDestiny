API — RightDestiny

Base: `http://localhost:3000`
Auth: Bearer Token (JWT) em `Authorization: Bearer <token>` quando exigido.
Formato: JSON com `{ ok: boolean, ... }`. Erros: `{ ok: false, error: string }`.

Saúde e diagnóstico
- GET `/api/health`
  - Resposta 200: `{ ok: true, info: { now, user, db, version } }`
- GET `/api/ping`
  - Resposta 200: `{ ok: true, result: { pong: 1 } }`

Autenticação
- POST `/api/auth/register`
  - Body: `{ email: string, password: string, name?: string }`
  - 201: `{ ok: true, token, user }`
  - 400: campos obrigatórios ausentes; 409: email já cadastrado
- POST `/api/auth/login`
  - Body: `{ email: string, password: string }`
  - 200: `{ ok: true, token, user }`
  - 401: credenciais inválidas
- GET `/api/me` (auth)
  - 200: `{ ok: true, user }`

Favoritos (auth)
- GET `/api/favorites`
  - 200: `{ ok: true, items: Favorite[] }`
- POST `/api/favorites`
  - Body: `{ item_key: string, item_type: string, title?: string, url?: string, image_url?: string }`
  - 201: `{ ok: true, item }`
  - Regra de unicidade: `unique(user_id, item_key, item_type)`
- DELETE `/api/favorites/:id`
  - 200: `{ ok: true }`
- DELETE `/api/favorites/by-key/:item_type/:item_key`
  - 200: `{ ok: true }`

Logs de busca
- POST `/api/search-logs`
  - Body: `{ query_text?: string, cidade?: string }`
  - 201: `{ ok: true }`

Hotéis e opções de hospedagem
- GET `/api/hotels/:slug/options`
  - 200: `{ ok: true, items: HotelOption[] }`
- POST `/api/hotels/:slug/options` (auth)
  - Body: `{ title: string, description?: string, price: number, currency?: string, capacity?: number, image_url?: string, hotel_name?: string, city?: string, country?: string }`
  - Cria o hotel se não existir (por `slug`).
  - 201: `{ ok: true, item }`

Exemplos (curl)
```
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123","name":"John"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}' | jq -r .token)

# Me
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/me

# Adicionar favorito
curl -X POST http://localhost:3000/api/favorites \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"item_key":"/ViagensParis.html","item_type":"destino","title":"Paris","url":"/ViagensParis.html"}'

# Listar opções de hotel
curl http://localhost:3000/api/hotels/burj-al-arab/options

# Inserir opção de hotel
curl -X POST http://localhost:3000/api/hotels/burj-al-arab/options \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Suíte Deluxe","price":3500,"currency":"AED","capacity":2}'
```

Observações
- Sempre envie `Content-Type: application/json` em requisições com body.
- Para endpoints protegidos, envie `Authorization: Bearer <token>`.

