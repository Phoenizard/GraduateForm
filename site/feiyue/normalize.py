"""学校 / 项目名称规范化。

来源优先级:
1. site/data/school_map.csv —— 人工审核覆盖表(最高优先级),处理无法自动匹配的脏数据
   (如中文校名、缩写、拼写错误)。列: raw_school, canonical_name, abbrv, region
2. src/data/universities.js —— 自动补全院校列表(按地区注释分组),作为规范名/缩写/地区索引。

未命中且 school_map.csv 也无记录的原始串,会被收集并追加到 school_map.csv 的待补全区
(canonical_name 留空),同时回退使用原始串本身,保证构建不中断。
"""

import csv
import re
from pathlib import Path

# 相对本文件: site/feiyue/normalize.py -> 仓库根
REPO_ROOT = Path(__file__).resolve().parents[2]
UNIVERSITIES_JS = REPO_ROOT / "src" / "data" / "universities.js"
SCHOOL_MAP_CSV = Path(__file__).resolve().parents[1] / "data" / "school_map.csv"

REGION_MARKERS = {
    "英国": "英国",
    "美国": "美国",
    "香港": "香港",
    "新加坡": "新加坡",
    "澳大利亚": "澳大利亚",
    "加拿大": "加拿大",
    "欧陆": "欧陆",
}
OTHER_REGION = "其他"


def _alias_key(name: str) -> str:
    """归一化为匹配键: 去括号内容、转小写、去标点与空白。"""
    if not name:
        return ""
    s = re.sub(r"[（(].*?[)）]", "", name)  # 去括号(中英)
    s = s.lower()
    s = re.sub(r"[^a-z0-9一-鿿]", "", s)  # 仅留字母数字与中文
    return s


_TOKEN_STOPWORDS = {
    "university", "college", "institute", "school", "the", "of", "and", "in",
    "for", "at", "polytechnic", "technology", "science", "sciences", "national",
}


def signature_tokens(name: str, abbrv: str = "") -> set[str]:
    """院校的「特征词」: 名称中去停用词、长度>=4 的词 + 缩写小写。用于把自由文本去向
    匹配到已知院校(如 'University of Columbia' 命中 'columbia')。"""
    toks = set()
    for w in re.findall(r"[a-z]+", name.lower()):
        if len(w) >= 4 and w not in _TOKEN_STOPWORDS:
            toks.add(w)
    ab = re.sub(r"[^a-z]", "", abbrv.lower())
    if len(ab) >= 3:
        toks.add(ab)
    return toks


def _extract_abbrv(name: str) -> str:
    """提取括号内缩写,如 'University College London (UCL)' -> 'UCL'。"""
    m = re.search(r"[（(]\s*([^)）]+?)\s*[)）]", name)
    return m.group(1).strip() if m else ""


def _base_name(name: str) -> str:
    """去掉括号缩写后的主名,用作 canonical_name。"""
    return re.sub(r"\s*[（(].*?[)）]\s*", "", name).strip()


def parse_universities_js() -> list[dict]:
    """解析 universities.js, 返回 [{name, abbrv, region}]。"""
    text = UNIVERSITIES_JS.read_text(encoding="utf-8")
    records = []
    region = OTHER_REGION
    for line in text.splitlines():
        line = line.strip()
        marker = re.match(r"//\s*-+\s*(\S+)\s*-+", line)
        if marker:
            region = REGION_MARKERS.get(marker.group(1), OTHER_REGION)
            continue
        sm = re.match(r"['\"](.+?)['\"]\s*,?\s*$", line)
        if not sm:
            continue
        raw = sm.group(1).replace("\\'", "'")
        records.append({
            "name": _base_name(raw),
            "abbrv": _extract_abbrv(raw) or _base_name(raw),
            "region": region,
        })
    return records


class SchoolNormalizer:
    def __init__(self):
        self._by_alias: dict[str, dict] = {}
        self._unmatched: set[str] = set()

        # 1) universities.js 索引(名称别名 + 缩写别名)
        for rec in parse_universities_js():
            self._by_alias.setdefault(_alias_key(rec["name"]), rec)
            ab = rec["abbrv"]
            if ab and ab != rec["name"]:
                self._by_alias.setdefault(_alias_key(ab), rec)

        # 2) school_map.csv 覆盖(优先级最高,覆盖自动索引)
        self._overrides: dict[str, dict] = {}
        if SCHOOL_MAP_CSV.exists():
            with open(SCHOOL_MAP_CSV, encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    raw = (row.get("raw_school") or "").strip()
                    canonical = (row.get("canonical_name") or "").strip()
                    if not raw or not canonical:
                        continue  # 待补全行(canonical 留空)跳过
                    self._overrides[_alias_key(raw)] = {
                        "name": canonical,
                        "abbrv": (row.get("abbrv") or canonical).strip(),
                        "region": (row.get("region") or OTHER_REGION).strip() or OTHER_REGION,
                    }

    def normalize(self, raw_school: str) -> dict | None:
        """返回 {name, abbrv, region};空串返回 None(调用方应跳过该条目)。"""
        raw = (raw_school or "").strip()
        if not raw:
            return None
        key = _alias_key(raw)
        if not key:
            return None
        if key in self._overrides:
            ov = self._overrides[key]
            if ov["name"] == "-":  # 显式标记跳过(垃圾数据)
                return None
            return dict(ov)
        if key in self._by_alias:
            return dict(self._by_alias[key])
        # 未命中: 记录待审核, 回退用原始串
        self._unmatched.add(raw)
        return {"name": raw, "abbrv": raw, "region": OTHER_REGION}

    def flush_unmatched(self) -> int:
        """把未命中的原始校名追加到 school_map.csv 待补全区(canonical 留空)。
        返回新增条数。"""
        if not self._unmatched:
            return 0
        existing_raw = set()
        file_exists = SCHOOL_MAP_CSV.exists()
        if file_exists:
            with open(SCHOOL_MAP_CSV, encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    existing_raw.add((row.get("raw_school") or "").strip())
        new = sorted(s for s in self._unmatched if s not in existing_raw)
        if not new:
            return 0
        SCHOOL_MAP_CSV.parent.mkdir(parents=True, exist_ok=True)
        with open(SCHOOL_MAP_CSV, "a", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            if not file_exists:
                w.writerow(["raw_school", "canonical_name", "abbrv", "region"])
            for s in new:
                w.writerow([s, "", "", ""])  # 待人工补全
        return len(new)


# ---- 项目名 / 学位 规范化 ----

_LEVEL_PATTERNS = [
    (r"\bph\.?\s?d\b|\bdphil\b|博士", "PhD"),
    (r"\bm\.?phil\b", "MPhil"),
    (r"\bm\.?res\b", "MRes"),
    (r"\bm\.?eng\b", "MEng"),
    (r"\bm\.?a\b(?![a-z])", "MA"),
    (r"\bm\.?sc\b|\bmaster of science\b|\bmsci\b|硕士", "MSc"),
    (r"\bmaster\b|\bms\b|\bms[c]?\b", "MSc"),
]


def normalize_project(raw_project: str) -> str:
    """轻度归一项目名: trim + 压缩空白 + 统一 MSc 写法。不做激进合并。"""
    s = (raw_project or "").strip()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\bM\.?\s?Sc\.?\b", "MSc", s, flags=re.IGNORECASE)
    s = re.sub(r"\bMaster of Science\b", "MSc", s, flags=re.IGNORECASE)
    return s


def derive_level(project: str, degree_codes: list[str]) -> str:
    """从项目文本推断学位层级;失败则回退 q5。"""
    text = (project or "").lower()
    for pat, level in _LEVEL_PATTERNS:
        if re.search(pat, text):
            return level
    if degree_codes:
        if "phd" in degree_codes:
            return "PhD"
        if "master" in degree_codes:
            return "MSc"
    return ""
