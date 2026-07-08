#!/usr/bin/env python3
"""建国時・進化会議時の自己検証スクリプト。
- agents/ 22名の存在、frontmatter、6要素(QUALITY第2節)、モデル階級制(第4節)の一致
- workflows のYAML妥当性、scripts の構文
"""
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# QUALITY第4節 配属表(slug: (model, effort))
EXPECTED = {
    "rei": ("claude-opus-4-8", "medium"),
    "metsuke": ("claude-opus-4-8", "xhigh"),
    "mekiki": ("claude-sonnet-4-6", "high"),
    "okite": ("claude-sonnet-4-6", "high"),
    "yomi": ("claude-sonnet-4-6", "high"),
    "shirabe": ("claude-sonnet-4-6", "high"),
    "hirameki": ("claude-sonnet-4-6", "high"),
    "kataribe": ("claude-sonnet-4-6", "high"),
    "tsukuru": ("claude-sonnet-4-6", "high"),
    "hikari": ("claude-sonnet-4-6", "medium"),
    "iroha": ("claude-sonnet-4-6", "medium"),
    "wataru": ("claude-sonnet-4-6", "medium"),
    "tsuzuri": ("claude-sonnet-4-6", "medium"),
    "musubi": ("claude-sonnet-4-6", "medium"),
    "kaketsu": ("claude-sonnet-4-6", "medium"),
    "shiori": ("claude-sonnet-4-6", "medium"),
    "mamoru": ("claude-sonnet-4-6", "medium"),
    "kazoe": ("claude-sonnet-4-6", "medium"),
    "yarikuri": ("claude-sonnet-4-6", "medium"),
    "mame": ("claude-sonnet-4-6", "medium"),
    "matome": ("claude-haiku-4-5", "low"),
    "hirome": ("claude-haiku-4-5", "medium"),
}

SECTIONS = ["役割と権限", "判断基準", "出力フォーマット", "良い例", "禁止事項", "完了条件"]

errors: list[str] = []
warnings: list[str] = []


def check_agents() -> None:
    for slug, (model, effort) in EXPECTED.items():
        f = REPO / "agents" / f"{slug}.md"
        if not f.exists():
            errors.append(f"agents/{slug}.md がない")
            continue
        text = f.read_text()
        got_model = re.search(r"^model:\s*(\S+)", text, re.M)
        got_effort = re.search(r"^effort:\s*(\S+)", text, re.M)
        if not got_model or got_model.group(1) != model:
            errors.append(f"{slug}: model が配属表と不一致(期待 {model} / 実際 {got_model.group(1) if got_model else 'なし'})")
        if not got_effort or got_effort.group(1) != effort:
            errors.append(f"{slug}: effort が配属表と不一致(期待 {effort} / 実際 {got_effort.group(1) if got_effort else 'なし'})")
        for sec in SECTIONS:
            if sec not in text:
                errors.append(f"{slug}: 6要素のうち「{sec}」が見当たらない(QUALITY第2節)")
        if len(text) < 800:
            warnings.append(f"{slug}: 本文が短い({len(text)}字)。手抜きプロンプトの疑い")
        if "fast" in text.lower() and "fast mode" not in text.lower() and "fast_mode" not in text.lower():
            pass  # ノイズ回避


def check_employees_json() -> None:
    emp = json.loads((REPO / "scripts" / "employees.json").read_text())
    if set(emp.keys()) != set(EXPECTED.keys()):
        errors.append(f"employees.json のslug集合が22名と不一致: {set(emp) ^ set(EXPECTED)}")


def check_workflows() -> None:
    try:
        import yaml  # type: ignore
    except ImportError:
        warnings.append("PyYAML なし: workflow YAML検証をスキップ")
        return
    for f in (REPO / ".github" / "workflows").glob("*.yml"):
        try:
            yaml.safe_load(f.read_text())
        except Exception as e:
            errors.append(f"workflow {f.name}: YAMLエラー {e}")


def check_scripts() -> None:
    for f in (REPO / "scripts").glob("*.sh"):
        r = subprocess.run(["bash", "-n", str(f)], capture_output=True, text=True)
        if r.returncode != 0:
            errors.append(f"{f.name}: bash構文エラー {r.stderr.strip()}")
    for f in (REPO / "scripts").glob("*.py"):
        r = subprocess.run([sys.executable, "-m", "py_compile", str(f)], capture_output=True, text=True)
        if r.returncode != 0:
            errors.append(f"{f.name}: python構文エラー {r.stderr.strip()}")


def check_secrets_not_committed() -> None:
    # 雑だが強力: それらしいトークン文字列の走査(マモルの週次でも実行)
    # プレフィックスの後に実体(16文字以上)が続く場合のみ検出(説明文の「sk-ant-…」は無視)
    pat = re.compile(r"(sk-ant-[A-Za-z0-9_\-]{16,}|xoxb-[A-Za-z0-9\-]{16,}|ghp_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{16,}|Bot [A-Za-z0-9_\-\.]{50,})")
    for f in REPO.rglob("*"):
        if f.is_dir() or ".git" in f.parts or f.suffix in {".png", ".zip", ".svg"}:
            continue
        if f.name == "validate.py":
            continue  # 検出パターン自身
        try:
            if pat.search(f.read_text(errors="ignore")):
                errors.append(f"認証情報らしき文字列: {f.relative_to(REPO)}(憲法第10条・即削除)")
        except Exception:
            continue


def main() -> None:
    check_agents()
    check_employees_json()
    check_workflows()
    check_scripts()
    check_secrets_not_committed()
    for w in warnings:
        print(f"⚠️  {w}")
    if errors:
        print(f"\n❌ {len(errors)}件の問題:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print(f"✅ 検証OK: 22名の6要素・モデル階級制・workflows・scripts すべて基準を満たす")


if __name__ == "__main__":
    main()
