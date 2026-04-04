#!/usr/bin/env python3
"""
SnapRoute 개발 로그 추출기
~/.claude/projects/... 의 JSONL 파일들을 읽어 마크다운 튜토리얼로 변환

사용법: python3 scripts/export_devlog.py
출력: docs/devlog.md
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime

JSONL_DIR = Path.home() / ".claude/projects/-home-lucky-projects-SnapRoute"
OUTPUT = Path(__file__).parent.parent / "docs/devlog.md"

# 필터링할 패턴 (시스템 메시지, 로컬 커맨드 등)
SKIP_PATTERNS = [
    r"<local-command",
    r"<command-name>",
    r"<system-reminder>",
    r"<user-prompt-submit-hook>",
]


def extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for c in content:
            if not isinstance(c, dict):
                continue
            if c.get("type") == "text":
                parts.append(c.get("text", ""))
            elif c.get("type") == "tool_use":
                name = c.get("name", "?")
                inp = c.get("input", {})
                # 도구 호출은 간략하게만 표시
                if name == "Bash":
                    cmd = inp.get("command", "")[:120]
                    parts.append(f"\n> `$ {cmd}`\n")
                elif name in ("Read", "Edit", "Write", "Glob", "Grep"):
                    fp = inp.get("file_path") or inp.get("pattern") or inp.get("path") or ""
                    parts.append(f"\n> [{name}: `{fp}`]\n")
                # 나머지 도구는 생략
        return "".join(parts)
    return ""


def should_skip(text: str) -> bool:
    if not text.strip():
        return True
    for pat in SKIP_PATTERNS:
        if re.search(pat, text):
            return True
    return False


def load_session(path: Path) -> list[dict]:
    """JSONL 파일 하나에서 user/assistant 메시지 추출"""
    msgs = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            if obj.get("type") not in ("user", "assistant"):
                continue

            content = obj.get("message", {}).get("content", "")
            text = extract_text(content).strip()

            if should_skip(text):
                continue

            # 타임스탬프 추출 (있으면)
            ts = obj.get("message", {}).get("timestamp") or ""

            msgs.append({"role": obj["type"], "text": text, "ts": ts})

    return msgs


def format_session(session_id: str, msgs: list[dict], idx: int) -> str:
    lines = [f"\n## 세션 {idx} — `{session_id[:8]}...`\n"]
    for m in msgs:
        if m["role"] == "user":
            lines.append(f"\n### 🙋 질문\n\n{m['text']}\n")
        else:
            lines.append(f"\n### 🤖 답변\n\n{m['text']}\n")
        lines.append("\n---\n")
    return "".join(lines)


def main():
    jsonl_files = sorted(JSONL_DIR.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)

    if not jsonl_files:
        print("JSONL 파일을 찾을 수 없습니다.")
        sys.exit(1)

    print(f"{len(jsonl_files)}개 세션 발견")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    all_sections = [
        "# SnapRoute 개발 일지\n",
        "\n> GPS EXIF 사진 → 한국 행정구역 지도 시각화 프로젝트 전 개발 과정 기록\n",
        f"\n> 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n",
        "\n---\n",
    ]

    total_msgs = 0
    for i, path in enumerate(jsonl_files, start=1):
        session_id = path.stem
        msgs = load_session(path)
        total_msgs += len(msgs)
        print(f"  [{i}] {session_id[:8]}... → {len(msgs)}개 메시지")
        if msgs:
            all_sections.append(format_session(session_id, msgs, i))

    output_text = "".join(all_sections)
    OUTPUT.write_text(output_text, encoding="utf-8")

    size_kb = OUTPUT.stat().st_size // 1024
    print(f"\n완료: {OUTPUT}")
    print(f"총 {total_msgs}개 메시지, {size_kb}KB")


if __name__ == "__main__":
    main()
