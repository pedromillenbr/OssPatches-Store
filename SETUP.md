# 🥋 OssPatches - Documentação de Configuração

> Sistema de e-commerce premium para faixas e patches de Jiu-Jitsu

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura de Produtos](#estrutura-de-produtos)
- [Gerenciamento de Preços](#gerenciamento-de-preços)
- [Modificações Rápidas](#modificações-rápidas)
- [Estrutura de Dados](#estrutura-de-dados)

---

## 📌 Visão Geral

OssPatches é um e-commerce completo para venda de faixas e patches de Jiu-Jitsu com as seguintes características:

✅ **13 faixas** (5 adultas + 5 infantis + em breve: mestres)
✅ **3 linhas de patches** por tamanho (P, M, G)
✅ **6 formatos** de patch customizável
✅ **Personalização** com nome bordado, graus e listra
✅ **Preços fixos** fáceis de atualizar

---

## 📦 Estrutura de Produtos

### Faixas Adultas

```
Branca → Azul → Roxa → Marrom → Preta
```

| Faixa | Preço Base | Preço Custom |
|-------|-----------|--------------|
| Todas | R$ 40,00  | R$ 80,00     |

**Tamanhos:** A0 (menor) → A4 (maior)
**Graus:** 0, 1, 2, 3, 4

---

### Faixas Infantis

```
Branca → Cinza → Amarela → Laranja → Verde
```

| Faixa | Preço Base | Preço Custom | Opções |
|-------|-----------|--------------|--------|
| Todas | R$ 40,00  | R$ 80,00     | Com/ sem listra (branca ou preta) |

**Tamanhos:** M0 (menor) → M4 (maior)
**Graus:** 0, 1, 2, 3, 4
**Listra:** Sem listra, listra branca, listra preta

---

### Patches

3 tamanhos de patch personalizado:

| Patch | Intervalo | Preço |
|-------|-----------|-------|
| Pequeno | até 7cm | R$ 40,00 |
| Médio | 7-15cm | R$ 40,00 |
| Grande | acima de 15cm | R$ 40,00 |

**Formatos disponíveis:**
- ◻ Quadrado
- ▭ Retângulo
- △ Triângulo
- ● Círculo
- ⬡ Hexagonal
- ◈ Octogonal

**Dimensões customizáveis:** Altura, largura, circunferência (em cm)

---

## 💰 Gerenciamento de Preços

### Usando o Config Manager (Python)

Localização: `config_manager.py` (raiz do projeto)

#### Listar Faixas

```bash
python config_manager.py list-belts
```

#### Listar Patches

```bash
python config_manager.py list-patches
```

#### Atualizar Preços de Faixas

```bash
python config_manager.py update-belt-prices 40 80
# Argumentos: <preço_base> <preço_custom>
```

#### Atualizar Preços de Patches

```bash
python config_manager.py update-patch-prices 40
# Argumento: <preço>
```

#### Exportar Tabela de Preços

```bash
python config_manager.py export-prices pricing.txt
```

#### Ver Estatísticas

```bash
python config_manager.py stats
```

---

## 🔧 Modificações Rápidas

### Editar Diretamente no JSON

**Arquivo:** `src/data/products.json`

Exemplo de faixa:

```json
{
  "id": "faixa-branca-adulto",
  "name": "Faixa Branca - Adulto",
  "basePrice": 40,
  "customPrice": 80,
  "category": "belt-adult",
  "color": "white",
  "colorHex": "#F5F5F5",
  "sizes": ["A0", "A1", "A2", "A3", "A4"],
  "hasDegrees": true
}
```

Exemplo de patch:

```json
{
  "id": "patch-pequeno",
  "name": "Patch Pequeno (até 7cm)",
  "basePrice": 40,
  "category": "patch",
  "sizes": ["P"],
  "formats": ["quadrado", "retangulo", "triangulo", "circulo", "hexagonal", "octogonal"]
}
```

---

## 📊 Estrutura de Dados

### Campo - Produto

```typescript
interface Product {
  id: string;                    // Identificador único
  slug: string;                  // URL amigável
  name: string;                  // Nome do produto
  shortName: string;             // Nome curto (display)
  category: string;              // 'belt-adult' | 'belt-kids' | 'patch'
  color: string;                 // Nome da cor
  colorHex: string;              // Código hexadecimal
  basePrice: number;             // Preço padrão
  customPrice: number;           // Preço personalizado
  description: string;           // Descrição longa
  features: string[];            // Lista de características
  sizes: string[];               // Tamanhos disponíveis
  hasDegrees?: boolean;          // Se tem graus (faixas)
  hasStripe?: boolean;           // Se tem opção de listra (infantis)
  images: string[];              // URLs das imagens
  inStock: boolean;              // Em estoque?
  metaTitle: string;             // SEO: title tag
  metaDescription: string;       // SEO: meta description
  badge?: string;                // 'Popular', 'Premium', etc.
}
```

---

## 🎨 Cores Disponíveis

### Faixas Adultas

```javascript
{
  'white': '#F5F5F5',      // Branca
  'blue': '#1E40AF',       // Azul
  'purple': '#7C3AED',     // Roxa
  'brown': '#78350F',      // Marrom
  'black': '#171717'       // Preta
}
```

### Faixas Infantis

```javascript
{
  'white': '#F5F5F5',      // Branca
  'gray': '#6B7280',       // Cinza
  'yellow': '#CA8A04',     // Amarela
  'orange': '#EA580C',     // Laranja
  'green': '#15803D'       // Verde
}
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `src/data/products.json` | Base de dados de produtos |
| `src/config/index.ts` | Configurações globais |
| `config_manager.py` | Gerenciador de preços e dados |
| `DOCUMENTATION.html` | Tabela visual interativa |
| `README.md` | Este arquivo |

---

## 🚀 Próximas Etapas

1. **Atualize as imagens** em `public/images/belts/` e `public/images/patches/`
2. **Configure variáveis de ambiente** (`.env.local`)
3. **Integre pagamentos** (Mercado Pago, PayPal)
4. **Configure Google Sheets** para receber pedidos
5. **Implante em produção** (Vercel, AWS, etc.)

---

## 📞 Suporte

Para modificações em massa, use o `config_manager.py`:

```bash
# Exemplo: Aumentar todos os preços de faixas
python config_manager.py update-belt-prices 50 100

# Exemplo: Atualizar preço de patches
python config_manager.py update-patch-prices 45
```

---

**Última atualização:** 2026-04-09
**Versão:** 1.0.0
