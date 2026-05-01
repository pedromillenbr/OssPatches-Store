#!/usr/bin/env python3
"""
OssPatches Configuration Manager
Ferramenta para facilitar atualizações de preços e dados de produtos
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Any

# Paths
PROJECT_ROOT = Path(__file__).parent
PRODUCTS_JSON = PROJECT_ROOT / "src/data/products.json"


class OssPatchesManager:
    """Gerenciador de configurações da OssPatches"""

    def __init__(self):
        self.products_file = PRODUCTS_JSON
        self.data = self._load_products()

    def _load_products(self) -> Dict[str, Any]:
        """Carrega dados de produtos"""
        with open(self.products_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_products(self) -> None:
        """Salva dados de produtos"""
        with open(self.products_file, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
            print(f"✓ Produtos salvos em {self.products_file}")

    # ─── FAIXAS (BELTS) ───────────────────────────────────────────────────

    def update_belt_prices(self, base_price: float, custom_price: float) -> None:
        """Atualiza preços de TODAS as faixas"""
        for belt in self.data["belts"]:
            belt["basePrice"] = base_price
            belt["customPrice"] = custom_price
        self._save_products()
        print(f"✓ Preços de faixas atualizados: R${base_price} (padrão), R${custom_price} (custom)")

    def update_belt_by_id(self, belt_id: str, **kwargs) -> None:
        """Atualiza dados de uma faixa específica"""
        for belt in self.data["belts"]:
            if belt["id"] == belt_id:
                belt.update(kwargs)
                self._save_products()
                print(f"✓ Faixa '{belt_id}' atualizada")
                return
        print(f"✗ Faixa '{belt_id}' não encontrada")

    def list_belts(self) -> None:
        """Lista todas as faixas"""
        print("\n" + "=" * 80)
        print("FAIXAS DISPONÍVEIS")
        print("=" * 80)
        for belt in self.data["belts"]:
            print(
                f"{belt['id']:30} | {belt['name']:30} | R${belt['basePrice']:6.2f} / R${belt['customPrice']:6.2f}"
            )
        print("=" * 80 + "\n")

    # ─── PATCHES ───────────────────────────────────────────────────────────

    def update_patch_prices(self, price: float) -> None:
        """Atualiza preços de TODOS os patches"""
        for patch in self.data["patches"]:
            patch["basePrice"] = price
            patch["customPrice"] = price
        self._save_products()
        print(f"✓ Preços de patches atualizados: R${price}")

    def list_patches(self) -> None:
        """Lista todos os patches"""
        print("\n" + "=" * 80)
        print("PATCHES DISPONÍVEIS")
        print("=" * 80)
        for patch in self.data["patches"]:
            print(
                f"{patch['id']:30} | {patch['name']:30} | R${patch['basePrice']:6.2f}"
            )
        print("=" * 80 + "\n")

    # ─── UTILITÁRIOS ───────────────────────────────────────────────────────

    def get_total_products(self) -> Dict[str, int]:
        """Retorna contagem total de produtos"""
        return {
            "belts": len(self.data["belts"]),
            "patches": len(self.data["patches"]),
            "total": len(self.data["belts"]) + len(self.data["patches"]),
        }

    def export_pricing_table(self, output_file: str = "pricing.txt") -> None:
        """Exporta tabela de preços"""
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("OssPatches - Tabela de Preços\n")
            f.write("=" * 80 + "\n\n")

            f.write("FAIXAS\n")
            f.write("-" * 80 + "\n")
            for belt in self.data["belts"]:
                f.write(
                    f"{belt['name']:40} | Padrão: R${belt['basePrice']:6.2f} | Custom: R${belt['customPrice']:6.2f}\n"
                )

            f.write("\n" + "-" * 80 + "\n")
            f.write("PATCHES\n")
            f.write("-" * 80 + "\n")
            for patch in self.data["patches"]:
                f.write(f"{patch['name']:40} | R${patch['basePrice']:6.2f}\n")

        print(f"✓ Tabela de preços exportada para {output_file}")


def main():
    """Interface CLI"""
    manager = OssPatchesManager()

    if len(sys.argv) < 2:
        print("usage: config_manager.py [command] [options]")
        print("\nComandos:")
        print("  list-belts              - Lista todas as faixas")
        print("  list-patches            - Lista todos os patches")
        print("  update-belt-prices <base> <custom> - Atualiza preços de faixas")
        print("  update-patch-prices <price>        - Atualiza preços de patches")
        print("  export-prices <output.txt>         - Exporta tabela de preços")
        print("  stats                   - Mostra estatísticas")
        return

    command = sys.argv[1]

    if command == "list-belts":
        manager.list_belts()
    elif command == "list-patches":
        manager.list_patches()
    elif command == "update-belt-prices":
        if len(sys.argv) >= 4:
            base = float(sys.argv[2])
            custom = float(sys.argv[3])
            manager.update_belt_prices(base, custom)
        else:
            print("uso: config_manager.py update-belt-prices <preço_base> <preço_custom>")
    elif command == "update-patch-prices":
        if len(sys.argv) >= 3:
            price = float(sys.argv[2])
            manager.update_patch_prices(price)
        else:
            print("uso: config_manager.py update-patch-prices <preço>")
    elif command == "export-prices":
        output = sys.argv[2] if len(sys.argv) >= 3 else "pricing.txt"
        manager.export_pricing_table(output)
    elif command == "stats":
        counts = manager.get_total_products()
        print(f"\nEstatísticas:")
        print(f"  Faixas:  {counts['belts']}")
        print(f"  Patches: {counts['patches']}")
        print(f"  Total:   {counts['total']}\n")
    else:
        print(f"Comando desconhecido: {command}")


if __name__ == "__main__":
    main()
