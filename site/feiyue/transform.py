"""加载已冻结的 4 张派生表 (University / Program / Student / Application)。

数据源自 Supabase(现已冻结),经旧版 Deriver + normalize 规范化并过隐私门槛后,
固化在 site/data/frozen/。构建不再访问网络;若需重新派生,见 git 历史中本文件的
Supabase 版本。所有 4 个记录均为「以行 id 为键的 dict」, 与 docs.py 的 id 互查约定一致。
"""

import json
from pathlib import Path

FROZEN_DIR = Path(__file__).resolve().parents[1] / "data" / "frozen"


def get_records() -> list[dict]:
    recs = [json.loads((FROZEN_DIR / n).read_text(encoding="utf-8"))
            for n in ("University.json", "Program.json", "Student.json", "Application.json")]
    print(f"Loaded frozen data: {len(recs[2])} students, {len(recs[1])} programs")
    return recs
