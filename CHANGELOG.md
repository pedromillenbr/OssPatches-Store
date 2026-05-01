# OssPatches - Guia Rápido 🥋

## Resumo das Mudanças

### ✅ Faixas - Estrutura Completa IBJJF

**Adultas (5):**
- Branca → Azul → Roxa → Marrom → Preta

**Infantis (5):**
- Branca → Cinza → Amarela → Laranja → Verde
- **NOVO:** Opção de listra (sem listra, branca ou preta)

Todos com:
- Preço base: **R$ 40**
- Preço personalizado: **R$ 80**
- Tamanhos: A0-A4 (adulto) / M0-M4 (infantil)
- Graus: 0, 1, 2, 3, 4

---

### ✅ Patches - 3 Tamanhos, 1 Tipo

Em vez de 3 tipos distintos, agora:

**Tamanhos:**
1. **Pequeno (P)** - até 7cm → R$ 40
2. **Médio (M)** - 7-15cm → R$ 40 ⭐ Popular
3. **Grande (G)** - acima de 15cm → R$ 40

**Formatos (6):**
- ◻ Quadrado
- ▭ Retângulo
- △ Triângulo
- ● Círculo
- ⬡ Hexagonal
- ◈ Octogonal

**Customização:**
- ✅ Upload de arte
- ✅ Dimensões customizáveis (altura, largura, circunferência em cm)
- ✅ Quantidade ilimitada

---

### ✅ Hero - Animação de Faixas

Faixas agora **flutuam constantemente** na tela do lado direito:

```
Branca ↑
  Cinza ↑
Amarela ↑
  Verde ↑
   Azul ↑
   Roxa ↑
 Marrom ↑
  Preta ↑
```

Efeito suave de subida com fade in/out. Loop infinito a cada 6 segundos.

---

### ✅ Estatísticas Atualizadas

Antes:
```
11        3            100%           Global
Cores de faixa | Tipos de patch | Produção própria | Envio mundial
```

Depois:
```
8              3                  100%           Global
Faixas que não  | Patches que não  | Produção própria | Envio mundial
desbotam        | desfiam
```

---

## 🔧 Como Atualizar Preços

### Opção 1: Script Python Rápido
```bash
python quick_update.py
```

### Opção 2: Config Manager Completo
```bash
python config_manager.py update-belt-prices 40 80
python config_manager.py update-patch-prices 40
```

### Opção 3: Editar JSON Direto
```
src/data/products.json
```

---

## 📊 Dados Técnicos

**Total de produtos:** 13
- 5 faixas adultas
- 5 faixas infantis (com opção de listra)
- 3 patches por tamanho

**Animações:**
- Hero: Faixas flutuando (6s loop)
- Customizador: Fade in/out de opções
- Carrinho: Transições suaves

**Novos Campos:**
- `hasStripe` (faixas infantis)
- `stripe` (customização: 'none' | 'white' | 'black')
- `heightCm, widthCm, circumferenceCm` (dimensões de patch)

---

## 📁 Arquivos Novos

```
├── config_manager.py      ← Gerenciador completo
├── quick_update.py        ← Script rápido
├── DOCUMENTATION.html     ← Tabela visual interativa
└── SETUP.md              ← Este arquivo (guia)
```

---

## 🎯 Checklist de Produção

- [ ] Atualizar imagens (`public/images/`)
- [ ] Configurar `.env.local` com credenciais
- [ ] Testar animações no Hero
- [ ] Testar opção de listra em faixas infantis
- [ ] Testar seleção de dimensões em patches
- [ ] Validar checkout com novos dados
- [ ] Deploy em Vercel/AWS/etc

---

**Status:** ✅ Pronto para produção
**Versão:** 1.0.0
**Data:** 2026-04-09
