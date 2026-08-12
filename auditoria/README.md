# TOYINPS AUDITORIA CQ-PFZ — Servidor Local

Aplicativo de auditoria de Controle de Qualidade da linha de montagem de motores,
agora rodando em um **servidor local** (no PC da empresa), sem depender da nuvem.

Substitui o Firebase por **Node.js + Express + SQLite**, com sincronização em tempo
real entre dispositivos na rede interna via WebSocket.

---

## O que mudou em relação à versão Firebase

| Antes (v5.5)                         | Agora (servidor local)                          |
|--------------------------------------|--------------------------------------------------|
| Dados no Firebase (nuvem do Google)  | Dados no próprio PC (arquivo SQLite)            |
| Senhas em texto puro                 | Senhas com **hash bcrypt** no servidor          |
| Fotos em base64 no Firestore (≤1 MB) | Fotos como **arquivos** em `server/data/uploads/` (banco leve) |
| Chart.js / jsPDF via CDN (internet)  | Bibliotecas **locais** (`public/vendor/`) — offline |
| Sync em tempo real via Firestore     | Sync em tempo real via **WebSocket** local      |

---

## Como rodar no PC (servidor)

Pré-requisito: **Node.js 18 ou superior** instalado no PC.

```bash
# 1. Instalar as dependências (só na primeira vez)
npm install

# 2. Ligar o servidor
npm start
```

Ao ligar, o terminal mostra os endereços de acesso, por exemplo:

```
  Local:   http://localhost:3000
  Rede:    http://192.168.0.10:3000   (use este no celular/tablet)
```

- No próprio PC: abra `http://localhost:3000`
- Em celulares/tablets/outros PCs **na mesma rede**: abra o endereço `Rede:` mostrado
  (o IP varia conforme a sua rede).

> Para o servidor ficar sempre ligado, deixe o PC ligado com o `npm start` rodando.
> (Opcional: configurar como serviço do Windows/Linux para iniciar sozinho.)

---

## Usuários padrão (primeiro acesso)

Criados automaticamente na primeira vez que o servidor sobe:

| Usuário     | Senha            | Papel     |
|-------------|------------------|-----------|
| `admin`     | `Toyotacqpfz123` | Admin     |
| `auditor`   | `1234`           | Inspetor  |
| `qualidade` | `q1234`          | Inspetor  |

> Troque a senha do `admin` no primeiro acesso (menu de troca de senha do app).

---

## Onde ficam os dados

Tudo dentro de `server/data/` no PC:

- `toyinps.db` — banco SQLite (auditorias, usuários, configurações, defeitos)
- `uploads/` — fotos das auditorias (gravadas como arquivos; o banco guarda só a URL)

**Backup:** basta copiar a pasta `server/data/` para um pen drive / rede.

---

## Estrutura do projeto

```
insp/
├── server/
│   ├── server.js      # Express: API REST + WebSocket + serve o app
│   ├── db.js          # Banco SQLite (schema)
│   ├── auth.js        # Login com bcrypt + usuários padrão
│   └── data/          # Banco e uploads (gerado em runtime, não versionado)
├── public/
│   ├── index.html     # O aplicativo (mesma interface de sempre)
│   └── vendor/        # Chart.js e jsPDF locais (funciona offline)
├── package.json
└── README.md
```

---

## API (referência rápida)

| Método | Rota                       | Função                                   |
|--------|----------------------------|------------------------------------------|
| POST   | `/api/login`               | Login (verifica senha com bcrypt)        |
| POST   | `/api/change-password`     | Trocar senha                             |
| GET    | `/api/config`              | Ler configuração global + lista de usuários (sem senha) |
| POST   | `/api/config`              | Salvar configuração (projetos/botões/turnos) |
| POST   | `/api/users/sync`          | Sincronizar lista de usuários            |
| GET    | `/api/col/:col`            | Listar coleção (`audits`, `users`, `pendingUsers`, `defects`) |
| GET    | `/api/col/:col/:id`        | Ler um registro                          |
| PUT    | `/api/col/:col/:id`        | Criar/atualizar um registro              |
| DELETE | `/api/col/:col/:id`        | Remover um registro                      |

Atualizações são propagadas em tempo real a todos os dispositivos via WebSocket.

---

## Observações de segurança

- O acesso é pensado para a **rede local** da empresa. As senhas trafegam em HTTP
  simples na rede interna; se precisar expor fora da empresa, coloque o servidor
  atrás de HTTPS (proxy reverso) antes.
- As senhas ficam **com hash bcrypt** no banco — nunca em texto puro.
