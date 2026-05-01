#!/usr/bin/env python3
"""
OssPatches - Quick Price Update Script
Script simples para atualizar preços rapidamente
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
PRODUCTS_FILE = PROJECT_ROOT / "src/data/products.json"

def main():
    print("\n🥋 OssPatches - Atualizador Rápido de Preços\n")

    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("=" * 80)
    print("PREÇOS ATUAIS")
    print("=" * 80)

    # Mostrar preços das faixas
    belt = data['belts'][0]
    print(f"\nFaixas:")
    print(f"  Padrão: R$ {belt['basePrice']:.2f}")
    print(f"  Custom: R$ {belt['customPrice']:.2f}")

    # Mostrar preços dos patches
    patch = data['patches'][0]
    print(f"\nPatches:")
    print(f"  Valor: R$ {patch['basePrice']:.2f}")

    print("\n" + "=" * 80)
    print("OPÇÕES")
    print("=" * 80)
    print("1. Atualizar preços de faixas")
    print("2. Atualizar preços de patches")
    print("3. Atualizar tudo")
    print("4. Sair")

    choice = input("\nEscolha uma opção (1-4): ").strip()

    if choice == "1":
        base = float(input("Preço base (padrão): R$ "))
        custom = float(input("Preço custom (personalizada): R$ "))
        for belt in data['belts']:
            belt['basePrice'] = base
            belt['customPrice'] = custom
        print(f"✓ Faixas atualizadas: R$ {base:.2f} / R$ {custom:.2f}")

    elif choice == "2":
        price = float(input("Preço do patch: R$ "))
        for patch in data['patches']:
            patch['basePrice'] = price
            patch['customPrice'] = price
        print(f"✓ Patches atualizados: R$ {price:.2f}")

    elif choice == "3":
        base = float(input("Preço base de faixas: R$ "))
        custom = float(input("Preço custom de faixas: R$ "))
        patch_price = float(input("Preço de patches: R$ "))
        for belt in data['belts']:
            belt['basePrice'] = base
            belt['customPrice'] = custom
        for patch in data['patches']:
            patch['basePrice'] = patch_price
            patch['customPrice'] = patch_price
        print(f"✓ Tudo atualizado!")

    elif choice == "4":
        print("Saindo...")
        return

    else:
        print("Opção inválida")
        return

    # Salvar
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✓ Arquivo salvo: {PRODUCTS_FILE}\n")

if __name__ == '__main__':
    main()
